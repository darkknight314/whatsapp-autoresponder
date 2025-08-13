#!/bin/bash

SNS_TOPIC_ARN="arn:aws:sns:ap-south-1:515966535766:whatsapp-notifier" 
MESSAGE="bot.js was down and has been restarted."
/usr/bin/aws sns publish \
  --topic-arn "$SNS_TOPIC_ARN" \
  --message "Monitor script started" \
  --subject "Startup Test"

while true
do
    if ! pgrep -f "node /home/ec2-user/first_attempt/bot.js" > /dev/null
    then
        pkill -f chrome
        rm nohup.out
        aws sns publish \
            --topic-arn "$SNS_TOPIC_ARN" \
            --message "$MESSAGE"   
        setsid nohup node /home/ec2-user/first_attempt/bot.js
	echo $AWS_ACCESS_KEY_ID

    fi
    sleep 60
done
