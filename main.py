import requests, os
import sys

import datetime
from groq import Groq

client = Groq( api_key=os.environ.get("GROQ_API_KEY"),)

def main():
    print("Welcome to Takina")
    print("How shall I help? ")

    while(True):
        task = input()
        contains_timeframe = check_for_time_frame(task)

        if contains_timeframe:
            task = change_string(task, contains_timeframe)
            call_groq(task)

            print("Quit? (y/n)")
            quit_or_not = ""
            while (not quit_or_not == "y" and not quit_or_not == "n"):
                quit_or_not = input()
                if quit_or_not == "y":
                    sys.exit(0)
                elif quit_or_not == "n":
                    print("How shall I help? ")
                    break
                print("Invalid option. Choose from the options y and n.")
        else:
            print("Please include a timeframe. Try again.")
            continue

def check_for_time_frame(task):
    global client

    comparison_string = f"Does this provide a time frame? Only answer in yes or no, but if yes provide the number of days until the due date. If yes, don't say anything other than the number. Include today. Today's Date: {datetime.date.today()}. Today's Day: {datetime.date.today().strftime("%A")} User input: {task}"  

    yes_or_no = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": comparison_string,
                    }
                ],
            model="llama-3.3-70b-versatile"
            )

    if 'no' in yes_or_no.choices[0].message.content or 'No' in yes_or_no.choices[0].message.content:
        return False

    return yes_or_no.choices[0].message.content


def change_string(task, timeframe):
    return f"Schedule the following task EVENLY through {timeframe} days. Copy the following format:\ntask progress\ntask progress\nmore tasks if needed\n\ntask progress\ntask progress\nmore tasks if needed\n\nEach group separated by double new lines represents one day, and 'task progress' should represent what you should do each day.\nDo not introduce yourself, do not say anything except for the task progress lines. \nUser input:\n{task}"

def call_groq(task):
    global client


    chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": task,
                    }
                ],
            model="deepseek-r1-distill-llama-70b",
            )

    task_list = chat_completion.choices[0].message.content.split("</think>")[1]
    task_list = task_list.split("\n\n")

    new_task_list = []
    for i in task_list:
        new_list = i.split("\n")
        new_task_list.append(new_list)

    day_num = 1

    for i in new_task_list[1:]:
        print(f"Day {day_num}")
        for j in i:
            print(f"- {j}")

        day_num += 1




if __name__ == "__main__":
    main()
