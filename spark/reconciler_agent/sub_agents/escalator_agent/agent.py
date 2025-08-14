"""Escalator sub-agent for creating human escalation reports."""

from google.adk.agents import Agent
from .prompt import get_escalator_prompt
from .tools.create_report import create_and_save_report

escalator_agent = Agent(
    model="gemini-2.5-flash",
    name="escalator_agent",
    description="Creates comprehensive escalation reports for failed transactions requiring human intervention",
    instruction=get_escalator_prompt(),
    tools=[
        create_and_save_report,
    ],
)