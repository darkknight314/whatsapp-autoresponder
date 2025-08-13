require('dotenv').config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require("puppeteer");
const axios = require("axios");
const qrcode = require('qrcode-terminal');
const schedule = require("node-schedule");
const AWS = require('aws-sdk');
const fs = require('fs');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("Logging key");
console.log(OPENAI_API_KEY);
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: puppeteer.executablePath(),
    headless: true,
    args: ['--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-features=VizDisplayCompositor',
          '--single-process',
          '--no-zygote',
          '--renderer-process-limit=1',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-offer-store-unmasked-wallet-cards',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-crash-upload',
          '--no-pings',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--use-mock-keychain',
          '--disable-software-rasterizer']
  }
});

const IGNORED_NUMBERS = [
];



client.on("authenticated", () => console.log("Client authenticated successfully!"));

client.on("auth_failure", (msg) => console.error("AUTHENTICATION FAILURE:", msg));

client.on("ready", async () => {
  console.log("Client is ready!");
  const bhattuBday = new Date(2025, 2, 29, 0, 0, 0);
  const rishuBday = new Date(2025, 2, 31, 0, 0, 0);
  const nevuBday = new Date(2025, 5, 21, 7, 30, 0);

  try {
    console.log("Checking for unread messages from the past 24 hours...");
    const chats = await client.getChats();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let processedCount = 0;

    for (const chat of chats) {
      if (chat.unreadCount == 0)  continue;
      const contact = await message.getContact(); 
      
      if ((chat.isReadOnly || chat.lastMessage.isStatus || chat.isGroup || chat.id.user === 'status' || chat.contact?.isBusinessContact || IGNORED_NUMBERS.includes(chat.id.user)) || !contact.isMyContact) {
        continue;
      }
      if (chat.unreadCount > 0) {
        console.log(`Processing ${chat.unreadCount} unread messages in chat with ${chat.name}`);
        
        // Fetch recent messages from this chat
        const messages = await chat.fetchMessages({
          limit: Math.min(chat.unreadCount, 10) 
        });
        
        // Process each unread message thats within the past 24 hours
        for (const message of messages.reverse()) {
          // Skip processing if message is from the bot itself
          if (message.fromMe) continue;
          
          // Check if message is within last 24 hours
          const messageTime = new Date(message.timestamp * 1000);
          if (messageTime >= twentyFourHoursAgo) {
            console.log(`Processing message from ${messageTime.toLocaleString()}`);
            
            // Add a small delay between processing messages to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

            /*let amTagged = false;
            try {
              if (message.mentionedIds.length > 0) {
                const mentions = await message.getMentions();
                for (let user of mentions) {
                  if (user && user.isMe) {
                    amTagged = true;
                    break;
                  }
                }
              }
            } catch (err) {
              console.error("Error processing mentions:", err);
            }
            
            if(!amTagged && chat.isGroup) continue;*/
            const botId = client.info.wid._serialized;
            let system_prompt = "";
            try {
              system_prompt = fs.readFileSync('system_prompt.txt', 'utf8');
            } catch (err) {
              console.error('Error reading file:', err);
              system_prompt = "You are a helpful assistant.";
            }
            
            // Get message history for context
            let messagesHistory = await chat.fetchMessages({ limit: 10 });
            messagesHistory = messagesHistory.reverse();
            
            const conversationMessages = [
              { role: "system", content: system_prompt }
            ];

            const messageBlob = [];
            messagesHistory.forEach((msg) => {
              if (msg && msg.from) {
                let speaker = msg.from === botId ? "Assistant" : "Person";
                messageBlob.push({
                  speaker: msg.body
                });
              }
            });

            conversationMessages.push({
              role: "user",
              content: JSON.stringify(messageBlob.reverse())
            });

            // Get AI response
            const aiResponse = await getAIResponse(conversationMessages);
            
            // Reply to the message
            await message.reply(aiResponse);
            processedCount++;
            
            // Mark the chat as read after processing
            await chat.sendSeen();
          }
        }
      }
    }
    console.log(`Finished processing ${processedCount} unread messages from the past 24 hours.`);
  } catch (error) {
    console.error("Error processing unread messages:", error);
  }

  // Original scheduled birthday messages
  schedule.scheduleJob(bhattuBday, async () => {
    console.log("Sending scheduled message...");
    try {
      await client.sendMessage("120363396452354279@g.us", "This message is sent on behalf of Daddy Pratik. Don't expect a response, especially if you don't tag him: Happy 26th birthday to the chottu motu of the group <3...congrats on being one year closer to death! Lmk if you want me to fund a chinese randi for you :P");
      console.log("Birthday message sent successfully");
    } catch (error) {
      console.error("Error sending birthday message:", error);
    }
  });
  
  schedule.scheduleJob(rishuBday, async () => {
    console.log("Sending scheduled message...");
    try {
      await client.sendMessage("120363396452354279@g.us", "This message is sent on behalf of Daddy Pratik. Don't expect a response, especially if you don't tag him: Happy birthday, my love! Even though the gap between us may seem insurmountable, do remember I still live in your heart and you in mine <3");
      console.log("Birthday message sent successfully");
    } catch (error) {
      console.error("Error sending birthday message:", error);
    }
  });
  
  schedule.scheduleJob(nevuBday, async () => {
    console.log("Sending scheduled message...");
    try {
      await client.sendMessage("120363396452354279@g.us", "Nomoskar and Khamma Ghani! This message is sent on behalf of Daddy Pratik. Don't expect a response, especially if you don't tag him: Happy birthday, my dearest Nevata <3, a constant ray of optimism...May your fish shop thrive and grow in success with every passing year!");
      console.log("Birthday message sent successfully");
    } catch (error) {
      console.error("Error sending birthday message:", error);
    }
  });
});

client.on("disconnected", (reason) => console.log("Client disconnected:", reason));




client.on('qr', async (qr) => {
  qrcode.generate(qr, { small: false });
  console.log('QR code received, scan it with your phone.');
  try {
    const sns = new AWS.SNS({region: 'ap-south-1'});
    await sns.publish({
      TopicArn: 'arn:aws:sns:ap-south-1:515966535766:whatsapp-notifier',
      Message: 'WhatsApp Bot needs QR code scan. Please check the EC2 instance.',
      Subject: 'WhatsApp Bot QR Code Alert'
    }).promise();
    
  } catch (error) {
    console.error("Failed to send QR notification:", error);
  }
});


client.on("message", async (message) => {
  
  const chat = await message.getChat();
  const botId = client.info.wid._serialized;
  let amTagged = false;
  
  // Check if bot is tagged in a group message
  if(message.mentionedIds.length > 0) {
    const mentions = await message.getMentions();
    for (let user of mentions) {
        amTagged = amTagged || user.isMe;
    }
  }
  const contact = await message.getContact(); 
  if (!amTagged && (chat.isReadOnly || chat.isGroup || chat.lastMessage.isStatus || chat.id.user === 'status' || contact.isBusiness || IGNORED_NUMBERS.includes(chat.id.user)) || !contact.isMyContact) {
    return;
  }

  let messagesHistory = await chat.fetchMessages({ limit: 10 });
  messagesHistory = messagesHistory.reverse();
  let system_prompt = ""
  try {
      system_prompt = fs.readFileSync('system_prompt.txt', 'utf8');
  } catch (err) {
      console.error('Error reading file:', err);
  }
  const conversationMessages = [
    { role: "system", content: system_prompt }
  ];

  const messageBlob = []
  // console.log("Chat object:", chat);

  messagesHistory.forEach((msg) => {
    let speaker = msg.from === botId ? "Assistant" : "Person";
    messageBlob.push({
      speaker : msg.body
    });
  });

  conversationMessages.push({
    role: "user",
    content: JSON.stringify(messageBlob.reverse())
  });

  const aiResponse = await getAIResponse(conversationMessages);

  message.reply(aiResponse);
  return;
});

async function getAIResponse(conversationHistory) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini-2024-07-18",
        messages: conversationHistory,
        temperature: 0.8
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "...";
  }
}

client.initialize();

