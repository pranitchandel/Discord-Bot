import DiscordJS, { Intents, MessageCollector } from "discord.js";
const express = require("express");
const {google} = require("googleapis");
import dotenv from "dotenv";

//--------------------------Googlesheets---------------------------------------
const app = express();
let users:any;
app.get("/",async (req:any,res:any) => {
  const auth = new google.auth.GoogleAuth({
    keyFile:"credentials.json",
    scopes:"https://www.googleapis.com/auth/spreadsheets",
  });

  //Create client instance for auth
  const client= await auth.getClient();

  //Instacne of google sheets API
  const googleSheets = google.sheets({version :"v4",auth:client})

  const spreadsheetId = "1Qrrlq-B8w3jqSoS-vG0igGKFC0yu8wUpcpIVyHfZjLo";
  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  })

  const getUsers = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range : "Users!A:A"
  })
  users = getUsers.data.values;
  //write rows 
  // await googleSheets.spreadsheets.values.append({
  //   auth,
  //   spreadsheetId,
  //   range : "Sheet1!A:B",
  //   valueInputOption:"USER_ENTERED",
  //   resource:{
  //     values:[
  //       ["Make a bot","Me"],
  //     ]
  //   }
  // })
  res.send(users);
})

app.listen(1337,(req:any,res:any) => console.log("running on 1337"));



//--------------------------Discord--------------------------------------
dotenv.config();
require('discord-reply');
const discordClient = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

discordClient.on("ready", () => {
  console.log("The bot is ready");
});

discordClient.on("messageCreate", async (message:any) => {
     if(message.content.startsWith("!join")){
      const filter = (m:any) => m.author.id === message.author.id;
      message.channel.send("Please provide your emailId")
      .then(() => {
        message.channel.awaitMessages({filter,
          max:1,
          time: 300000,
          errors:['time']
        })
          .then((message:any) => {
            message = message.first();
            message.channel.send("Enter you first name")
            .then(() => {
              message.channel.awaitMessages({filter,
                max:1,
                time: 300000,
                errors:['time']
              })
              .then((message:any) => {
                message = message.first();
                message.channel.send("Enter your phone number please")
                .then(() => {
                  message.channel.awaitMessages({filter,
                    max:1,
                    time: 300000,
                    errors:['time']
                  })
                  .then((message:any) => {
                    message = message.first();
                      message.channel.send("Please give me a minute, I am checking your details");
              })
              .catch((collected:any)=> {
                message.channel.send("Request timeout : phone number");
                console.log(collected.size);
              })
            })    
            })
            .catch((collected:any)=> {
              message.channel.send("Request timeout :first name");
              console.log(collected.size);
            })
          })   
        }) 
        .catch((collected:any)=> {
          message.channel.send("Request timeout : emailId");
          console.log(collected.size);
        })
      })
    }
});
discordClient.login(process.env.TOKEN);



