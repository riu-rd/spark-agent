"""Escalator sub-agent for creating comprehensive AI-generated reports."""

from google.adk.agents import Agent
from .prompt import get_escalator_prompt
from .tools.fetch_transaction_for_report import fetch_transaction_for_report
from .tools.save_generated_report import save_generated_report

escalator_agent = Agent(
    model="gemini-2.5-flash",
    name="escalator_agent",
    description="AI-powered report generation system that creates comprehensive, insightful reports for all transaction resolutions",
    instruction=get_escalator_prompt(),
    tools=[
        fetch_transaction_for_report,
        save_generated_report,
    ],
)