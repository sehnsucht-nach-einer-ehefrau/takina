import requests, os
import sys

from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def main():
    print("Welcome to Takina")
    print("How shall I help? ")

    while(True):
        task = input()
        contains_timeframe = check_for_time_frame(task)

        if contains_timeframe:
            task = change_string(task)    
            call_groq(task)

            print("Quit? (y/n)")
            quit_or_not = ""
            while (not quit_or_not == "y" and not quit_or_not == "n"):
                quit_or_not = input()
                if quit_or_not == "y":
                    sys.exit(0)
                elif quit_or_not == "n":
                    break
                print("Invalid option. Choose from the options y and n.")
        else:
            print("Please include a timeframe. Try again.")
            continue

def check_for_time_frame(task):
    global client

    comparison_string = f"Does this provide a time frame? Only answer in yes or no. User input: {task}"

    yes_or_no = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": comparison_string,
            }
        ],
        model="llama-3.1-8b-instant"
    )

    print(yes_or_no)
    yes_or_no = f"{yes_or_no}"

    if "Yes." in yes_or_no:
        return True
    elif 'no.' in yes_or_no or 'No.' in yes_or_no:
        return False
 

def change_string(task):
    return f"Schedule the following task evenly throughout the given time frame. Copy the following format:\ntask progress\ntask progress\ntask progress\n\nEach line represents one day, and 'task progress' should represent how much you should do in that day.\nDo not introduce yourself, do not say anything except for the task progress lines. \nUser input:\n{task}"

def call_groq(task):
    global client


    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": task,
            }
        ],
        model="llama-3.3-70b-versatile",
    )


    print(chat_completion.choices[0].message.content)



if __name__ == "__main__":
    main()
