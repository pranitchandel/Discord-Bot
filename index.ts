import DiscordJS, { Intents, TextChannel } from "discord.js";
const express = require("express");
const {google} = require("googleapis");
import dotenv from "dotenv";

dotenv.config();
require('discord-reply');
const discordClient = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

discordClient.on("ready", () => {
  console.log("The bot is ready");
});
//--------------------------Googlesheets---------------------------------------
const app = express();
var users : any =  [];
var clans : any = [];
var auth : any;
var spreadsheetId : any;
var googleSheets :any;
app.get("/",async (req:any,res:any) => {
  auth = new google.auth.GoogleAuth({
    keyFile:"credentials.json",
    scopes:"https://www.googleapis.com/auth/spreadsheets",
  });

  //Create client instance for auth
  const client= await auth.getClient();

  //Instacne of google sheets API
  googleSheets = google.sheets({version :"v4",auth:client})

  spreadsheetId = "1Qrrlq-B8w3jqSoS-vG0igGKFC0yu8wUpcpIVyHfZjLo";
  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  })

  const getUsers = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range : "Users!A:C"
  })

  const getClans = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range : "Clan!A:E"
  })
  clans = getClans.data.values;
  users = getUsers.data.values;
  res.send(users);
})

app.listen(1337,(req:any,res:any) => console.log("running on 1337"));

const updateUser = async (users:[]) => {
  await googleSheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range : "Users!A:C",
    valueInputOption:"USER_ENTERED",
    resource:{
    values:users
    }
}) 
}

//--------------------------Discord--------------------------------------

discordClient.on("messageCreate", async (message:any) => {
     if(message.content.startsWith("!join")){
      const subString = message.content.substring(5);
      const subStringArray = subString.split("-");
      if(subStringArray[0] == "" && subStringArray[1]== "clan"){
        console.log("valid command to join!!");
      }
      var currentClan : any;
      var userName : any;
      clans.map((clan:any) => {
        if(clan[0] === subString.substring(1) && clan[4] === "YES"){
          console.log("Clan present in sheet!!");
          currentClan = clan;
        }
      })
      if(currentClan === undefined){
        message.author.send("Sorry admissions are closed!!");
      }
      else{
        const filter = (m:any) => m.author.id === message.author.id;
        message.author.send("Please provide your emailId")
        .then(() => {
          message.channel.awaitMessages({filter,
            max:1,
            time: 300000,
            errors:['time']
          })
            .then((message:any) => {
              message = message.first();
              var currentUser : any;
              users.map((user:any,key:any) => {
                if(user[0] === message.content ){
                  currentUser =  {user,key};
                }
              })     
              if(currentUser === undefined){
                message.author.send("Sorry emailId is not registered");
              }
              else{
                var usr = currentUser.user[0];
                users[currentUser.key].shift();
                users[currentUser.key][0] = usr;
                users[currentUser.key][1] = currentClan[1];
                users[currentUser.key][2] = currentClan[2];
                var channelId = currentClan[2];
                message.author.send("Enter you first name")
                .then(() => {
                  message.channel.awaitMessages({filter,
                    max:1,
                    time: 300000,
                    errors:['time']
                  })
                  .then((message:any) => {
                    message = message.first();
                    userName = message.content;
                    message.author.send("Enter your phone number please")
                    .then(() => {
                      message.channel.awaitMessages({filter,
                        max:1,
                        time: 300000,
                        errors:['time']
                      })
                      .then((message:any) => {
                        message = message.first();
                          message.author.send("Please give me a minute, I am checking your details")
                          .then(() => {
                            updateUser(users);
                            ( discordClient.channels.cache.get(channelId) as TextChannel ).send(`Welcome to the clan @${userName}`);
                          })
                  })
                  .catch((collected:any)=> {
                    message.author.send("Request timeout : phone number");
                    console.log(collected.size);
                  })
                })    
                })
                .catch((collected:any)=> {
                  message.author.send("Request timeout :first name");
                  console.log(collected.size);
                })
              }) 
            }     
          }) 
          .catch((collected:any)=> {
            message.author.send("Request timeout : emailId");
            console.log(collected.size);
          })
        })     
    }
  }
});

discordClient.login(process.env.TOKEN);



