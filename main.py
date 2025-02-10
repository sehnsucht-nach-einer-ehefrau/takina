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

    comparison_string = f"Determine if the user input specifies a due date or time frame. Only answer 'yes' or 'no.' If no, respond only with 'no.' If yes, calculate the number of days including today and the due date itself until the deadline. Respond with the number alone. Example: If today is Monday, February 3, 2025, and the deadline is 'by this Sunday,' return 7 (Monday → Sunday). If the deadline is 'by Saturday,' return 6 (Monday → Saturday). Don't write code, don't do anything but give the number or just 'no.'. Today's date: {datetime.date.today()} Today's day: {datetime.date.today().strftime("%A")} User input: {task}"

    yes_or_no = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": comparison_string,
            }
        ],
        model="llama-3.3-70b-versatile"
    )

    print(yes_or_no.choices[0].message.content)

    if 'no' in yes_or_no.choices[0].message.content or 'No' in yes_or_no.choices[0].message.content:
        return False

    return yes_or_no.choices[0].message.content


def change_string(task, timeframe):
    return f"Return a daily breakdown of the following task evenly over {timeframe} days. ALWAYS UTILIZE ALL THE AVAILABLE DAYS. Each day's tasks should be specific and actionable, breaking the task into meaningful progress steps. Do not introduce yourself, do not include anything except the scheduled tasks. Format: [Task for Day 1]\n[Task for Day 1]\n[More tasks if needed]\n\n[Task for Day 2]\n[Task for Day 2]\n\n[More tasks if needed]\n...\nEach group separated by double new lines represents one day, so DON'T PUT THE DAY NUMBERS OR THE WORD DAY. Ensure that the steps logically progress toward completing the full task by the final day.\nUser input: {task}"

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

        print("")

        day_num += 1




if __name__ == "__main__":
    main()
