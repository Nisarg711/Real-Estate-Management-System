from typing import TypedDict, Annotated, Optional
from langgraph.graph import add_messages, StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage,SystemMessage
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from uuid import uuid4
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

# Initialize memory saver for checkpointing
memory = MemorySaver()
class State(TypedDict):
    messages: Annotated[list, add_messages]
    route:Optional[str]

search_tool = TavilySearchResults(
    max_results=4,
    tavily_api_key=os.getenv("TAVILY_KEY")
)

tools = [search_tool]

llm=ChatGroq(model="llama-3.3-70b-versatile")

llm_with_tools = llm.bind_tools(tools=tools)

async def model(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {
        "messages": [result], 
    }



async def router(state:State):
    ROUTER_PROMPT = """You are a routing classifier for Homemakers, a real estate platform in India.
Your only job is to read the user's message and decide which of three categories it belongs to.

Respond with EXACTLY ONE WORD: sql, search, or chat. Nothing else. No punctuation, no explanation.

Use "sql" when the user is asking to find, search, filter, or browse properties based on 
specific criteria that would be stored in a database, such as:
- Location (city, state, district, locality)
- Price or rent budget (under X, between X and Y)
- Property type (apartment, villa, independent house)
- Number of bedrooms/bathrooms, area in sqft
- Availability (for rent, for sale)
- Amenities (gym, parking, swimming pool, etc.)
Examples: "Show me 2BHK flats in Ahmedabad under 50 lakhs", 
"Are there any villas with a pool in Pune", 
"What properties are available for rent in Mumbai"

Use "search" when the user is asking about something requiring current, real-world information 
that is NOT stored in your property database, such as:
- Real estate news, market trends, or price trends
- Government policies, loan rates, tax rules
- General questions about a city or area that aren't about specific listings
Examples: "What are the latest real estate trends in India", 
"Is it a good time to invest in Bangalore real estate", 
"What is RERA"

Use "chat" for everything else, such as:
- Greetings and small talk
- Questions about Homemakers itself (how to list a property, how appointments work)
- General advice that doesn't require a database lookup or current web data
Examples: "Hi", "How do I schedule a visit", "What's the difference between renting and buying"

Respond with only one word: sql, search, or chat."""

    last_user_message = state["messages"][-1].content
    
    messages = [
        SystemMessage(content=ROUTER_PROMPT),
        HumanMessage(content=last_user_message)
    ]
    
    result = await llm.ainvoke(messages)
    decision = result.content.strip().lower()
    
    # Safety fallback in case the LLM outputs something unexpected
    if decision not in ["sql", "search", "chat"]:
        decision = "chat"
    
    return {"route": decision}


async def route_decision(state: State):
    route = state.get("route", "chat")
    
    if route == "sql":
        return "sql_node"      # doesn't exist yet, placeholder for now
    elif route == "search":
        return "model"          # goes to your existing Tavily-bound model
    else:
        return "model"          # chat also goes to existing model, just won't trigger tool calls

async def tools_router(state: State):
    last_message = state["messages"][-1]

    if(hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0):
        return "tool_node"
    else: 
        return END
    
async def tool_node(state):
    """Custom tool node that handles tool calls from the LLM."""
    # Get the tool calls from the last message
    tool_calls = state["messages"][-1].tool_calls
    
    # Initialize list to store tool messages
    tool_messages = []
    
    # Process each tool call
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]
        
        # Handle the search tool
        if tool_name == "tavily_search_results_json":
            # Execute the search tool with the provided arguments
            search_results = await search_tool.ainvoke(tool_args)
            
            # Create a ToolMessage for this result
            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                name=tool_name
            )
            
            tool_messages.append(tool_message)
    
    # Add the tool messages to the state
    return {"messages": tool_messages}

graph_builder = StateGraph(State)

graph_builder.add_node("model", model)
graph_builder.add_node("router",router)
graph_builder.set_entry_point("router")
graph_builder.add_conditional_edges("router", route_decision)
graph_builder.add_node("tool_node", tool_node)
graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge("tool_node", "model")

graph = graph_builder.compile(checkpointer=memory)

app = FastAPI()

# Add CORS middleware with settings that match frontend requirements

'''
Your Next.js app runs on localhost:3000, your FastAPI runs on localhost:8000 — different origins. 
Browsers block cross-origin requests by default unless the server explicitly 
allows it via CORS headers. This middleware adds those headers to every response, 
allowing requests from anywhere ("*"). 
In production you'd restrict allow_origins to your actual deployed domain instead of "*".
'''
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
    expose_headers=["Content-Type"], 
)

def serialise_ai_message_chunk(chunk): 
    if(isinstance(chunk, AIMessageChunk)):
        return chunk.content
    else:
        raise TypeError(
            f"Object of type {type(chunk).__name__} is not correctly formatted for serialisation"
        )

async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    is_new_conversation = checkpoint_id is None
    
    if is_new_conversation:
        # Generate new checkpoint ID for first message in conversation
        new_checkpoint_id = str(uuid4())

        config = {
            "configurable": {
                "thread_id": new_checkpoint_id
            }
        }
        
        # Initialize with first message
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
        '''At this exact line, nothing has run yet. No LLM call has happened. 
        No tool has executed. astream_events() just returns a generator object immediately — 
        think of it as a "recipe" for producing events one at a time, not the events themselves.'''



        
        # First send the checkpoint ID
        yield f"data: {{\"type\": \"checkpoint\", \"checkpoint_id\": \"{new_checkpoint_id}\"}}\n\n"
    else:
        config = {
            "configurable": {
                "thread_id": checkpoint_id
            }
        }
        # Continue existing conversation
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )

    async for event in events:
        '''it streams every internal event happening inside the graph: when a node starts, 
        when the LLM produces a token, when a tool starts, when a tool ends, etc. 
        Each event is a dict with an "event" key describing what kind of event it is.'''
        event_type = event["event"]

        #on_chat_model_stream fires every time the LLM produces a new token chunk
        if event_type == "on_chat_model_stream":
            chunk_content = serialise_ai_message_chunk(event["data"]["chunk"])
            # Escape single quotes and newlines for safe JSON parsing
            safe_content = chunk_content.replace("'", "\\'").replace("\n", "\\n")
            
            yield f"data: {{\"type\": \"content\", \"content\": \"{safe_content}\"}}\n\n"
            


        #on_chat_model_end fires once the LLM finishes its turn completely
        # (not token by token — the full response object).
        elif event_type == "on_chat_model_end":
            # Check if there are tool calls for search
            tool_calls = event["data"]["output"].tool_calls if hasattr(event["data"]["output"], "tool_calls") else []
            search_calls = [call for call in tool_calls if call["name"] == "tavily_search_results_json"]
            
            '''At this point you check: did the LLM's final output include a tool call? 
            If yes, extract the search query it wants to run and tell the frontend 
            "a search is starting" — this is what powers your "🔍 Searching for X..." UI state.'''

            if search_calls:
                # Signal that a search is starting
                search_query = search_calls[0]["args"].get("query", "")
                # Escape quotes and special characters
                safe_query = search_query.replace('"', '\\"').replace("'", "\\'").replace("\n", "\\n")
                yield f"data: {{\"type\": \"search_start\", \"query\": \"{safe_query}\"}}\n\n"

         
        elif event_type == "on_tool_end" and event["name"] == "tavily_search_results_json":
            # Search completed - send results or error
            output = event["data"]["output"]
            
            # Check if output is a list 
            if isinstance(output, list):
                # Extract URLs from list of search results
                urls = []
                for item in output:
                    if isinstance(item, dict) and "url" in item:
                        urls.append(item["url"])
                
                # Convert URLs to JSON and yield them
                urls_json = json.dumps(urls)
                yield f"data: {{\"type\": \"search_results\", \"urls\": {urls_json}}}\n\n"
    
    # Send an end event
    yield f"data: {{\"type\": \"end\"}}\n\n"

@app.get("/chat_stream/{message}")
#checkpoint_id: Optional[str] = Query(None) means 
# it's a query parameter — comes from ?checkpoint_id=xyz in the URL, defaults to None if not provided.
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id), 
        media_type="text/event-stream"
    )

'''StreamingResponse is FastAPI's way of saying "don't wait for the whole response — 
send chunks to the client as my generator yields them." 
The media_type="text/event-stream" is the MIME type that tells the browser "this is SSE, 
treat it accordingly."'''




'''
# WITH yield — sends each piece immediately
async def generate_chat_responses(...):
    async for event in events:
        yield f"data: ...\n\n"   # sent to client THE MOMENT this line executes
yield pauses the function exactly at that line, hands the value to whatever's consuming the generator 
(here, StreamingResponse), and only resumes once that consumer asks for the next value. 
StreamingResponse asks for the next value the instant it has flushed the current one 
over the HTTP connection — so there's a continuous relay race, never a "wait for it all, 
then send."



'''
# SSE - server-sent events 
# SSE - server-sent events -->Standard for streaming data from server to client over HTTP(Unidirectional)
#While Web socket is Bidirectional


# tavily_api_key=os.getenv("TAVILY_KEY")

'''
Why This SSE Format (data: {...}\n\n)
This is the Server-Sent Events protocol — a web standard for one-way server-to-client streaming 
over plain HTTP (no special protocol like WebSockets needed).
The format rules are:

Each event starts with data: 
Followed by the payload (here, a JSON string)
Terminated by two newlines (\n\n)

The browser's EventSource API (used in your frontend) understands this format natively — 
it automatically splits incoming bytes on \n\n and fires onmessage with event.data set 
to whatever followed data: .
'''



'''
Important Explaination of how the token by token sending is happening
What async for Actually Does
pythonasync for event in events:
    event_type = event["event"]
    ...
    yield f"data: ...\n\n"
This loop does not say "wait until everything is done, then give me all the events." It says:
1. Ask the generator: "give me your NEXT event"
2. The generator runs code internally UNTIL it hits a yield point inside LangGraph
3. That one event gets handed back to you
4. Your loop body runs (checks event_type, maybe yields SSE data)
5. Loop goes back to step 1 — ask for the NEXT event
6. Repeat until the generator says "I'm done"
So at any moment, only one event exists in memory at a time. 
The 50th event hasn't been created yet when you're processing the 3rd one.


Groq's servers generate token 1 → sends over network
    → langchain_groq receives it → wraps it as AIMessageChunk
    → LangGraph's astream_events sees this happen → creates an "on_chat_model_stream" event
    → that event is yielded out of graph.astream_events()
    → your "async for event in events" loop receives it
    → you yield it as an SSE chunk
    → FastAPI's StreamingResponse sends those bytes over HTTP immediately
    → browser's EventSource receives those bytes immediately
    → your React state updates immediately
    
[meanwhile, token 2 hasn't even been generated by Groq yet]

Groq's servers generate token 2 → sends over network
    → ...same chain repeats...
'''