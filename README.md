Steps to run:-
1. Add your openai api key in .env file, in the same format as .env_example.
2. Create a system_prompt.txt file and fill your corresponding prompt. The script will feed openai api with the prompt as system_prompt and last 10 messages of any new conversation. eg: You are a secretary focused on engaging in authentic dialogue.
3. You can populate IGNORED_NUMBERS variable in bot.js in case you don't want the script responding to some numbers. The script is only meant to respond to people in your contacts. It will not respond to business accounts or unsaved numbers.
4. Run the command as below, so that bot.js keeps running the background. It will ensure restarts in case that the bot.js script goes down.
```
nohup monitor.sh > monitor.log 2>&1
```
