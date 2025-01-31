

pip3 install -r requirements.txt

echo "    Welcome to the Takina boot menu."
echo "========================================="

if [ "$GROQ_API_KEY" = "" ]; then
  echo "\nStart by inputting your groq API: "

  read groq_api

  echo "Processing..."

  export GROQ_API_KEY="$groq_api"

fi

echo "Logs stored in logs.txt"
echo "booting takina..."

clear

echo "========================================="
python3 main.py

echo "Done." 
