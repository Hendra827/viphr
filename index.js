const fs = require("fs"); 
const moment = require("moment");
const qrcode = require("qrcode-terminal"); 
const { Client, MessageMedia } = require("whatsapp-web.js"); 
const fetch = require("node-fetch"); 
const puppeteer = require("puppeteer"); 
const cheerio = require("cheerio");
const SESSION_FILE_PATH = "./session.json";
const request = require("request");
const urlencode = require("urlencode");
const yts = require("./lib/cmd.js");
// file is included here
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}
client = new Client({   
    
       puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true,
    args: [
      "--log-level=3", // fatal only
   
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-experiments",
      "--ignore-gpu-blacklist",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    
      "--disable-extensions",
      "--disable-default-apps",
      "--enable-features=NetworkService",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    
      "--no-first-run",
      "--no-zygote"
    ]
    
    },        
    session: sessionCfg
});
// You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.

client.initialize();

// ======================= Begin initialize WAbot

client.on("qr", qr => {
  // NOTE: This event will not be fired if a session is specified.
  qrcode.generate(qr, {
    small: true
  });
  console.log(`[ ${moment().format("HH:mm:ss")} ] Please Scan QR with app!`);
});

client.on("authenticated", session => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] Authenticated Success!`);
  // console.log(session);
  sessionCfg = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    if (err) {
      console.error(err);
    }
  });
});

client.on("auth_failure", msg => {
  // Fired if session restore was unsuccessfull
  console.log(
    `[ ${moment().format("HH:mm:ss")} ] AUTHENTICATION FAILURE \n ${msg}`
  );
  fs.unlink("./session.json", function(err) {
    if (err) return console.log(err);
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] Session Deleted, Please Restart!`
    );
    process.exit(1);
  });
});

client.on("ready", () => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] Whatsapp bot ready!`);
});

// ======================= Begin initialize mqtt broker

// ======================= WaBot Listen on Event

client.on("message_create", msg => {
  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
  }
});

client.on("message_revoke_everyone", async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  // console.log(after); // message after it was deleted.
  if (before) {
    console.log(before.body); // message before it was deleted.
  }
});

client.on("message_revoke_me", async msg => {
  // Fired whenever a message is only deleted in your own view.
  // console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

  if (ack == 3) {
    // The message was read
  }
});
client.on('group_join', async (notification) => {
    // User has joined or been added to the group. 
    console.log('join', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Halo, selamat bergabung di grup ini yaa.. untuk melihat daftar perintah bot silahkan reply *!menu* .`);
  
    const chats = await client.getChats();
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Notifikasi : Halo Admin ada member baru di grupmu.');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on('group_leave', async (notification) => {
    // User has joined or been added to the group. 
    console.log('leave', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Selamat tinggal sayang`);
  
    const chats = await client.getChats();
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Notifikasi : Halo admin member baru saja keluar dari grupmu.');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on("group_update", notification => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("disconnected", reason => {
  console.log("Client was logged out", reason);
});

// ======================= WaBot Listen on message

client.on("message", async msg => {
  // console.log('MESSAGE RECEIVED', msg);
    const chat = await msg.getChat();
    const users = await msg.getContact()
    const dariGC = msg['author']
    const dariPC = msg['from']
   console.log(`[ ${moment().format("HH:mm:ss")} ]  => New Message : ${msg.body}
  participant
  `)
const botTol = () => {
        msg.reply('*Akses Untuk Menu Admin Ditolak*')
        return
    }
    const botTol2 = () => {
        msg.reply(`*Akses ini hanya untuk di grup saja*`)
        return
    }

    if (msg.body.startsWith('!subject ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.body.slice(9)
                chat.setSubject(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body === '!getmember') {
        const chat = await msg.getChat();

        let text = "";
        let mentions = [];

        for(let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);

            mentions.push(contact);
      text += "Hay Sayang";
            text += `@${participant.id.user} `;
      text += "\n";
        }

        chat.sendMessage(text, { mentions });
    } else if (msg.body.startsWith('!deskripsi ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user ) {
                let title = msg.body.split("!deskripsi ")[1]
                chat.setDescription(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!promote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                const contact = await msg.getContact();
                const title = msg.mentionedIds[0]
                chat.promoteParticipants([`${title}`])
                chat.sendMessage(`[:] @${title.replace('@c.us', '')} sekarang anda adalah admin sob 🔥`)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!demote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds[0]
                chat.demoteParticipants([`${title}`])
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!add ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '')) {
                let title = msg.body.slice(5)
                if (title.indexOf('62') == -1) {
                    chat.addParticipants([`${title.replace('0', '62')}@c.us`])
                    msg.reply(`Selamat datang @${title}! Gunakan Command *!menu* untuk melihat daftar perintah.`)
                } else {
                    msg.reply('[:] Format nomor harus 0821xxxxxx')
                }
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!kick ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds
                chat.removeParticipants([...title])
                // console.log([...title]);
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body == '!owner') {
        if (chat.isGroup) {
            msg.reply(JSON.stringify({
                owner: chat.owner.user
            }))
        } else {
            botTol2()
        }
    } 


  if (msg.type == "ciphertext") {
    // Send a new message as a reply to the current one
    msg.reply("kirim !menu atau !help untuk melihat menu.");
  }
  else if (msg.body == "!ping") {
    // Send a new message as a reply to the current one
    msg.reply("bot online sayang");
  }else if (msg.body.startsWith("!anime")) {
var fs = require('fs');
var files = fs.readdirSync('./kwpin')

/* now files is an Array of the name of the files in the folder and you can pick a random name inside of that array */
var  gambar = files[Math.floor(Math.random() * files.length)] 
var yuli = fs.readFileSync(
        "./kwpin/"+ gambar,
        "base64"
      );
const media = new MessageMedia('image/jpg', yuli);

console.log(gambar);
client.sendMessage(media);
}
 else if (msg.body.startsWith("!prepayer ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!prepayer ")[1];
   var nama = h.split("] ")[1];
   var kata1 = h.split("[")[1].split("]")[0];
    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/make-your-own-free-fire-youtube-banner-online-free-562.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
          await page.click("#radio0-radio-83d1c1baf4c44e72bacc6cb8fe1c92a0");
     await page.type("#text-1", kata1);
   
      await page.type("#text-0", nama);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!glowtext ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!glowtext ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/advanced-glow-effects-74.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/glow.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/glow.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
   else if (msg.body.startsWith("!neon ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!neon ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/neon.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/neon.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
   else if (msg.body.startsWith("!elloin ")) {
   msg.reply("_Mohon Menunggu Juragan_")
    var h = msg.body.split("!elloin ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/generate-banner-arena-of-valor-aov-with-name-440.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!anmaker")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!anmaker ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-an-impressive-anime-style-cover-317.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  		await page.click("#radio0-radio-557u0ki48");
     await page.type("#text-1", kata1);
   
		  await page.type("#text-0", nama);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }
 else if (msg.body.startsWith("!space")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!space ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/latest-space-3d-text-effect-online-559.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  await page.type("#text-0", nama);

     await page.type("#text-1", kata1);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	msg.reply(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }
 
 else if (msg.body.startsWith("!omega")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!omega ")[1];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/make-cover-league-of-king-257.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  		await page.click("#radio0-radio-bvgffx4jx");
		  await page.type("#text-0", nama);

		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }

   else if (msg.body.startsWith("!arum ")) {
   msg.reply("_Mohon Menunggu Juragan_")
    var h = msg.body.split("!arum ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-cover-lok-new-270.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!pornhub")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!pornhub ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-pornhub-style-logos-online-free-549.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  await page.type("#text-0", nama);

     await page.type("#text-1", kata1);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }

   else if (msg.body.startsWith("!spop ")) {
   msg.reply("_Mohon Menunggu Juragan_")
    var h = msg.body.split("!spop ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/make-avatar-style-crossfire-282.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }

 else if (msg.body.startsWith("!lolmaker ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!lolmaker ")[1];
   var nama = h.split("] ")[1];
   var kata1 = h.split("[")[1].split("]")[0];
    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/crtmle-youtube-banner-league-of-legends-online-428.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
          await page.click("#radio0-radio-v81gsz6qq");
     await page.type("#text-1", kata1);
   
      await page.type("#text-0", nama);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!retro")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!retro ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/free-retro-neon-text-effect-online-538.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  		await page.click("#radio1-radio-46f217383f194195a2fe05ef22300984");
     await page.type("#text-1", kata1);
   
		  await page.type("#text-0", nama);
     await page.type("#text-2", kata2);

		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }

 else if (msg.body.startsWith("!over ")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!over ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-youtube-banner-game-overwatch-409.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
		  		await page.click("#radio0-radio-sapriyt1g");
     await page.type("#text-1", kata1);
   
		  await page.type("#text-0", nama);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }

   else if (msg.body.startsWith("!goldplay ")) {
   msg.reply("_Mohon Menunggu Juragan_")
    var h = msg.body.split("!goldplay ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-silver-button-gold-button-social-network-online-450.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }

    else if (msg.body.startsWith("!tatto ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!tatto ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/make-tattoos-online-by-your-name-309.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!marvel")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!marvel ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-logo-3d-style-avengers-online-427.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
     await page.type("#text-1", kata1);
   
		  await page.type("#text-0", nama);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }
 else if (msg.body.startsWith("!love")) {
	 msg.reply("_Sedang di proses_ *NO SPAM*")
	  var h = msg.body.split("!love ")[1];
	 var nama = h.split("] ")[1];
	 var kata1 = h.split("[")[1].split("]")[0];
	 	const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-love-balloons-cards-334.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
     await page.type("#text-1", kata1);
   
		  await page.type("#text-0", nama);
		await page.click("#submit");
		await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

	chat.sendMessage(media);
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
	 
	 
  })();
 }
   else if (msg.body.startsWith("!aldous ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!aldous ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/make-mobile-legends-wallpaper-full-hd-for-mobile-454.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }

   else if (msg.body.startsWith("!dragon ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!dragon ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/free-online-dragon-ball-facebook-cover-photos-maker-443.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }

   else if (msg.body.startsWith("!hunter ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!hunter ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-cyber-hunter-facebook-cover-online-565.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    w
      });
   
   
  })();
 }

  else if (msg.body.startsWith("!galaxy ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!galaxy ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/wings-galaxy-206.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/galaxy.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/galaxy.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
   else if (msg.body.startsWith("!galaxy1 ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!galaxy1 ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/text-galaxy-tree-effect-288.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/galaxy1.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/galaxy1.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
   else if (msg.body.startsWith("!pubg ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!pubg ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/create-facebook-game-pubg-cover-photo-407.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/pubg.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/pubg.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }

  else if (msg.body.startsWith("!fb ")) {
var teks = msg.body.split("!fb ")[1];
const { exec } = require("child_process");
var url = "http://api.fdci.se/sosmed/fb.php?url="+ teks;

request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     url,
},function(error, response, body){
    let $ = cheerio.load(body);
  var b = JSON.parse(body);

 var teks = `
 Berhasil Mendownload 
 
 Judul = ${b.judul}
 
 Facebook Downloader By HR WhatsApp Bot (*´∇｀*)
 `;
 
exec('wget "' + b.link + '" -O mp4/fbvid.mp4', (error, stdout, stderr) => {
  let media = MessageMedia.fromFilePath('mp4/fbvid.mp4');
	client.sendMessage(msg.from, media, {
	caption: teks });
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});

});
}

	// random fakta unik
// pajaar - 2020
else if (msg.body == "!fakta") {
const fetch = require("node-fetch"); 
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-fakta-unik.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
	msg.reply(pjr);
	});
}

// lirik
else if (msg.body.startsWith("!lirik ")) {
var request = require("request");
let judul = msg.body.split(" ")[1];
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url: "http://tololbgt.coolpage.biz/lirik.php?judul="+judul
},function(error, response, body){
msg.reply(body.replace(/pjr-enter/g,"\n"));
});
}

// random pantun
// pajaar - 2020
else if (msg.body == "!pantun") {
const fetch = require("node-fetch"); 
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-pantun-pakboy.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
	msg.reply(pjr.replace(/pjrx-line/g,"\n"));
	});
}

// random anime HD v2
// pajaar 2020
else if (msg.body == "!animehd" ){
const fetch = require("node-fetch"); 
const imageToBase64 = require('image-to-base64');
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-gambar-anime.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
imageToBase64(pjr) // Image URL
    .then(
        (response) => {
const media = new MessageMedia('image/jpeg', response);
client.sendMessage(msg.from, media, {
caption: `Hey...` });
        }
    )
    .catch(
        (error) => {
            console.log(error); // Logs an error if there was one
        }
    )
});
}

else if (msg.body.startsWith("!translate ")) {
const translatte = require('translatte');
var codelang = msg.body.split("[")[1].split("]")[0];
var text = msg.body.split("]")[1];
translatte(text, {to: codelang}).then(res => {
    msg.reply(res.text);
}).catch(err => {
    msg.reply(err);
});
}
else if (msg.body.startsWith('!join ')) {
        const inviteCode = msg.body.split(' ')[1];
        const invite = inviteCode.replace('https://chat.whatsapp.com/', '');
        try {
            await client.acceptInvite(invite);
            msg.reply('Joined the group!');
        } catch (e) {
            msg.reply('That invite code seems to be invalid.');
        }
    }
else if (msg.body.startsWith("!liryc")) {

	var get = msg.body.split("!liryc ")[1];

	var artis = get.split("-")[0];

	var lirik = get.split("-")[1];

	const { getLyrics, getSong } = require('genius-lyrics-api');

const options = {

	apiKey: 'rN3QmPYNX4zdy60VX9JB9G1w-gThM1K3q1EbhCpOcOfNZkp_2VzbJ6jwBcfwFU42',

	title: lirik,

	artist: artis,

	optimizeQuery: true

};

}

  else if (msg.body.startsWith("!wiki ")) {
const cheerio = require('cheerio');
const request = require('request');
var yos = msg.body.split("!wiki ")[1]
var jokowi = yos.replace(/ /g, "%20");
function foreach(arr, func){
  for(var i in arr){
    func(i, arr[i]);
  }
}
var url = "https://id.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles="+ jokowi
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     url,
},function(error, response, body){
    let $ = cheerio.load(body);
    var d = JSON.parse(body);
var fik = body.split('"extract":"')[1];
console.log(`

/////////////
`)
msg.reply(fik)
});

}
else if (msg.body.startsWith("!ig ")) {
const imageToBase64 = require('image-to-base64');
var link = msg.body.split("!ig ")[1];
var url = "http://api.fdci.se/sosmed/insta.php?url="+ link;
const { exec } = require("child_process");
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     url,
},function(error, response, body){
    let $ = cheerio.load(body);
  var b = JSON.parse(body);
  
  var teks = ` Download Berhasil 
  
  Instagram Downloader By HR WhatsApp Bot`;
  if(b.link == false){
	  msg.reply(" maaf Kak link nya mana?");
  }else if( b.link.indexOf(".jpg") >= 0){
imageToBase64(b.link) // Path to the image
    .then(
        (response) => {
            ; // "cGF0aC90by9maWxlLmpwZw=="

const media = new MessageMedia('image/jpeg', response);
client.sendMessage(msg.from, media, {
	caption: teks });
        }
    )
    .catch(
        (error) => {
            console.log(error); // Logs an error if there was one
        }
    )
    }else if( b.link.indexOf(".mp4") >= 0){
    	exec('wget "' + b.link + '" -O mp4/insta.mp4', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('mp4/insta.mp4');
	client.sendMessage(msg.from, media, {
	caption: teks });
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
}
  
});
}

else if (msg.body == "!ptl2" ){
    const imageToBase64 = require('image-to-base64');
    var items = ["ullzang boy", "cowo ganteng", "cogan", "korean boy"];
    var cewe = items[Math.floor(Math.random() * items.length)];
    var url = "http://api.fdci.se/rep.php?gambar=" + cewe;
    
    request.get({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     url,
    },function(error, response, body){
        
      var b = JSON.parse(body);
    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Hai Manis 😊` });
            }
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )
    
    });
    }
  
   else if (msg.body == "!ptl1" ){
    const imageToBase64 = require('image-to-base64');
    var items = ["ullzang girl", "cewe cantik", "hijab cantik", "korean girl"];
    var cewe = items[Math.floor(Math.random() * items.length)];
    var url = "http://api.fdci.se/rep.php?gambar=" + cewe;
    
    request.get({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     url,
    },function(error, response, body){
        
      var b = JSON.parse(body);
    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Hai Kak 😊` });
            }
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )
    
    });
    }
    
    // Search Image
	
else if (msg.body.startsWith("!searchimage ")) {

var nama = msg.body.split("!searchimage ")[1];
var req = urlencode(nama.replace(/ /g,"+"));
    const imageToBase64 = require('image-to-base64');

    var url = "http://api.fdci.se/rep.php?gambar=" + req;
    
    request.get({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     url,
    },function(error, response, body){
        
      var b = JSON.parse(body);
    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Whoaaaa gambar di temukan 😲`  });
            }
        )
        .catch(
            (error) => {
               msg.reply(`Yaahhhh gambar tidak ditemukan 🤧`); // Logs an error if there was one
            }
        )
    
    });
    }
    
    // Berita Indonesia
	  else if (msg.body.startsWith("!berita ")) {
	   const keyword = msg.body.split("!berita ")[1];
const { Detik } = require('indo-news-scraper');
const imageToBase64 = require('image-to-base64');
var nomorlink = Math.floor(Math.random() * 5);
Detik.scrap(keyword).then(res => {
 console.log(res);
 var gambar = res[0].img;
 var judul = res[0].title;
 var url = res[0].url;
 
   imageToBase64(gambar) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Judul Berita :
 *${judul}*

Baca Berita Disini:
${url}
` });
            }
			
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )
    
});
   }

else if (msg.body.startsWith("!brainly ")) {
var hh = msg.body.split("!brainly ")[1]
var tanya = hh.replace(/ /g, "%20");
const fetch = require('node-fetch')

const url = "https://amiruldev.com/api/brainly/?q="+ tanya
var regex = /<br\s*[\/]?>/gi;
const solution = () => {
  fetch(url).then(res => res.json()).then((res) => {
    
res.data.questionSearch.edges.slice(-2).forEach(item => {
  var tanyaan = item.node.content
    item.node.answers.nodes.slice(-2).forEach(item => { 
 var jawaban = item['content']
 var g = jawaban.replace(regex, "\n")
 var h  = g.replace(/<[^>]*>?/gm, '');
  msg.reply(`
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!Brainly*
            
======================
Pertanyaan : 
    
      *${tanyaan.replace(regex, "\n")}*
      
Jawaban : 
    
      *${h}*
      
======================
      `);
   
      })
      console.log("=========")
    })
  })
}

solution();

}

else if (msg.body.startsWith("!sial ")) {
const request = require('request');
var req = msg.body;
var tanggal = req.split(" ")[1];
var kk = req.split(" ")[2];
var bulan = kk.replace("0", "");
var tahun = req.split(" ")[3];
request.post({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/primbon_hari_naas.php',
  body: "tgl="+ tanggal +"&bln="+ bulan +"&thn="+ tahun +"&submit=+Submit%21+"
},function(error, response, body){
    let $ = cheerio.load(body);
var y = $.html().split('<b>PRIMBON HARI NAAS</b><br><br>')[1];
    var t = y.split('.</i><br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
    var d = h.replace("&amp;", '&')
console.log(""+ d);
msg.reply(` 
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!sial*

-----------------------------------
 Cek Hari Naas Kamu ~
 
 ${d}
----------------------------------
*HR-WhatsApp © 2020* 
 `); 
});
}

else if (msg.body.startsWith("!pasangan ")) {
const request = require('request');
var req = msg.body;
var gh = req.split("!pasangan ")[1];

var namamu = gh.split("&")[0];
var pasangan = gh.split("&")[1];
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/kecocokan_nama_pasangan.php?nama1='+ namamu +'&nama2='+ pasangan +'&proses=+Submit%21+',
 
},function(error, response, body){
    let $ = cheerio.load(body);
var y = $.html().split('<b>KECOCOKAN JODOH BERDASARKAN NAMA PASANGAN</b><br><br>')[1];
    var t = y.split('.<br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
    var d = h.replace("&amp;", '&')
console.log(""+ d);
msg.reply(` 
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!Pasangan*

-----------------------------------

 *Cek Kecocokan Jodoh Berdasarkan Nama ~*
 
 
 ${d}
 
----------------------------------
*HR-WhatsApp © 2020* 
 
 `); 
});
}
 else if (msg.body.startsWith("!loker ")) {
const teks = msg.body.split("!loker ")[1];
var req = teks.split("[")[1].split("]")[0];
var kerjaan = teks.split("]")[1];
const indeed = require('indeed-scraper');

const queryOptions = {
  host: 'id.indeed.com',
  query: kerjaan,
  city: req,
  radius: '100',
  level: 'entry_level',
  jobType: 'fulltime',
  maxAge: '7',
  sort: 'date',
  limit: 100
};

indeed.query(queryOptions).then(res => {
client.sendMessage(msg.from, 
`
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!loker*

==============================
Nama Posisi :  *${res[0].title}*

Pekerjaan   : *${res[0].summary.replace("...", "").replace("...", "")}*

Perusahaan  : *${res[0].company}*

Tempat      : *${res[0].location}*

Waktu       : *${res[0].postDate}*

Link           : *${res[0].url}*

==============================

Nama Posisi :  *${res[1].title}*

Pekerjaan   : *${res[1].summary.replace("...", "")}*

Perusahaan  : *${res[1].company}*

Tempat      : *${res[1].location}*

Waktu       : *${res[1].postDate}*

Link           : *${res[1].url}*

==============================

Nama Posisi :  *${res[2].title}*

Pekerjaan   : *${res[2].summary.replace("...", "")}*

Perusahaan  : *${res[2].company}*

Tempat      : *${res[2].location}*

Waktu       : *${res[2].postDate}*

Link           : *${res[2].url}*

==============================

Nama Posisi :  *${res[3].title}*

Pekerjaan   : *${res[3].summary.replace("...", "")}*

Perusahaan  : *${res[3].company}*

Tempat      : *${res[3].location}*

Waktu       : *${res[3].postDate}*

Link           : *${res[3].url}*

==============================

`);

});
}

else if (msg.body == "!wait") {
  const fs = require("fs");
const { exec } = require("child_process");

    const chat = await msg.getChat();
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      
fs.writeFileSync("example.jpg", attachmentData.data, {encoding: 'base64'}, function(err) {
    console.log('File created');
});
const fetch = require("node-fetch")
const imageToBase64 = require('image-to-base64');
let response = ''
imageToBase64("example.jpg") // you can also to use url
    .then(
        (response) => {
fetch("https://trace.moe/api/search", {
  method: "POST",
  body: JSON.stringify({ image: response}),
  headers: { "Content-Type": "application/json" }
})
  .then(res => res.json())
  .then(result =>  {
var teks = `

What Anime Is That ?

Echi / Tidak : *${result.docs[0].is_adult}*
Judul Jepang : *${result.docs[0].title}*
Ejaan Judul : *${result.docs[0].title_romaji}*
Episode : *${result.docs[0].episode}*
Season  : *${result.docs[0].season}*

`;
var video = `https://trace.moe/preview.php?anilist_id=${result.docs[0].anilist_id}&file=${encodeURIComponent(result.docs[0].filename)}&t=${result.docs[0].at}&token=${result.docs[0].tokenthumb}`;
exec('wget "' + video + '" -O anime.mp4', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('anime.mp4');
  client.sendMessage(msg.from, media, {
  caption: teks });
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
 });
 }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
        }
    )

  }
else{
    const tutor = MessageMedia.fromFilePath('tutor.jpeg');

    client.sendMessage(msg.from, tutor, {
        caption: "Kirim gambar dengan caption *!wait* \n sesuai gambar diatas lalu tunggu sampai \n kita menemukan hasilnya"
      });
    }
}
else if (msg.body.startsWith("!nh ")) {
const kode = msg.body.split(" ")[1];
const NanaAPI = require("nana-api");
const nana = new NanaAPI();
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

// Get gallery from book ID or book link
nana.g(kode).then((g) => {
if (g == 'Book not found!'){
msg.reply("Kode nuklir nya salah , coba perhatiin lagi")
}else{
var url = "https://t.nhentai.net/galleries/"+ g.media_id +"/cover.jpg"

exec('wget "' + url + '" -O cover.jpg', (error, stdout, stderr) => {
 var teks = "Judul English  : "+ g.title.english.slice("0") +" \n \n Judul Japanese : "+ g.title.japanese +"\n \n Judul Pendek   : "+ g.title.pretty +"\n \n Kode Nuklir    : "+ g.id +" \n ";

let media = MessageMedia.fromFilePath('cover.jpg');
  client.sendMessage(msg.from, media, {
  caption: teks });
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
}
})

}else if (msg.body.startsWith("!ytmp3 ")) {
var url = msg.body.split(" ")[1];
var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

const ytdl = require("ytdl-core")
const { exec } = require("child_process");
if(videoid != null) {
   console.log("video id = ",videoid[1]);
} else {
    msg.reply("Videonya gavalid gan.");
}
ytdl.getInfo(videoid[1]).then(info => {
if (info.length_seconds > 3000){
msg.reply("terlalu panjang.. ")
}else{

console.log(info.length_seconds)

msg.reply(" Tunggu sebentar kak .. Lagi di proses ☺");
var YoutubeMp3Downloader = require("youtube-mp3-downloader");

//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "ffmpeg", 
    "outputPath": "./mp3",    // Where should the downloaded and en>
    "youtubeVideoQuality": "highest",       // What video quality sho>
    "queueParallelism": 100,                  // How many parallel down>
    "progressTimeout": 40                 // How long should be the>
});

YD.download(videoid[1]);


YD.on("finished", function(err, data) {


var musik = MessageMedia.fromFilePath(data.file);

msg.reply(` 
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!ytmp3*

-=[ Convert YT To MP3 ]=-   
  ----------------------------------

Nama File : *${data.videoTitle}*
Nama : *${data.title}*
Artis : *${data.artist}*

   ----------------------------------
*HR-WhatsApp © 2020* 
`);
msg.reply(musik);
});
YD.on("error", function(error) {
    console.log(error);
});

}});
}

else if (msg.body.startsWith("!tts")) {
  msg.reply('ketik !menu untuk melihat list menu bot | HR Bot');
  var texttomp3 = require("text-to-mp3");
    var fs = require("fs");

var suara = msg.body.split("!tts ")[1];
var text = suara;
var fn = "tts/suara.mp3";




if(process.argv.indexOf("-?")!== -1){
  console.log("TextToMp3 bach use the TextToMp3 library wich use the google translate public API to generate an mp3 with ");
  console.log("-t \t\t\t Provide the Text here with \" arround the text \", limited to 200 characters");
  console.log("-f \t\t\t Provide the file name of MP3 you whant generate, otherways it will be generated automatically");
  console.log("");
  return;
}


if(process.argv.indexOf("-t")!== -1)
  text=suara;

if(process.argv.indexOf("-f")!== -1)
  fn=suara;

text = text.replace(/ +(?= )/g,'');//remove all multiple space

if(typeof text ===  "undefined" || text === ""
  || typeof fn === "undefined" || fn === "") { // just if I have a text I'm gona parse
  console.log("missing required params, check out the help with -?");
}

//HERE WE GO
texttomp3.getMp3(text, function(err, data){
  if(err){
    console.log(err);
    return;
  }

  if(fn.substring(fn.length-4, fn.length) !== ".mp3"){ // if name is not well formatted, I add the mp3 extention
    fn+=".mp3";
  }
  var file = fs.createWriteStream(fn); // write it down the file
  file.write(data);
 
  console.log("MP3 SAVED!");
  
});
await new Promise(resolve => setTimeout(resolve, 500));

  if(text.length > 200){ // check longness of text, because otherways google translate will give me a empty file
  msg.reply("Text to long, split in text of 200 characters")
}else{
  const media = MessageMedia.fromFilePath(fn);

  msg.reply(media);

}


}
else if (msg.body.startsWith("!quotes")) {
const request = require('request');
request.get({
  headers: {
'user-agent' : 'Mozilla/5.0 (Linux; Android 8.1.0; vivo 1820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36'
},
  url: 'https://jagokata.com/kata-bijak/acak.html',
},function(error, response, body){
    let $ = cheerio.load(body);
    var author = $('a[class="auteurfbnaam"]').contents().first().text();
   var kata = $('q[class="fbquote"]').contents().first().text();

client.sendMessage(
        msg.from,
        `
     _${kata}_
        
    
  *~${author}*
         `
      );

});
}

else if (msg.body.startsWith("!kata-cinta")) {
const request = require('request');
request.get({
  headers: {
'user-agent' : 'Mozilla/5.0 (Linux; Android 8.1.0; vivo 1820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36'
},
  url: 'https://jagokata.com/kata-bijak/kata-cinta.html',
},function(error, response, body){
    let $ = cheerio.load(body);
    var author = $('a[class="auteurfbnaam"]').contents().first().text();
   var kata = $('q[class="fbquote"]').contents().first().text();

  msg.reply(
        msg.from,
        `
     _${kata}_
        
    
  *~${author}*
         `
      );

});
}


else if (msg.body.startsWith("!nama ")) {
const cheerio = require('cheerio');
const request = require('request');
var nama = msg.body.split("!nama ")[1];
var req = nama.replace(/ /g,"+");
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/arti_nama.php?nama1='+ req +'&proses=+Submit%21+',
},function(error, response, body){
    let $ = cheerio.load(body);
    var y = $.html().split('arti:')[1];
    var t = y.split('method="get">')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
console.log(""+ h);
msg.reply(`
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!nama*
   
      *Arti Dari Namamu*

  ----------------------------------
         Nama _*${nama}*_ ${h}
  ----------------------------------
*HR-WhatsApp © 2020* 
`
        );
});
}
else if (msg.body.startsWith("!sifat ")) {
const cheerio = require('cheerio');
const request = require('request');
var req = msg.body.split("[")[1].split("]")[0];
var nama = req.replace(/ /g," ");
var pesan = msg.body;
var y = pesan.replace(/ /g,"+ ");
var tanggal = y.split("]+")[1].split("-")[0];
var bulan = y.split("-")[1];
var tahun = y.split("-")[2];
request.post({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/sifat_karakter_tanggal_lahir.php',
  body:    "nama="+ req +"&tanggal="+ tanggal +"&bulan="+ bulan +"&tahun="+ tahun +"&submit=+Submit%21+"
},function(error, response, body){
 let $ = cheerio.load(body);
    $('title').after('body')
    var y = $.html().split('<b>Nama :</b>')[1];
    var t = y.split('</i><br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
console.log(""+ h);
            msg.reply(
            `
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!sifat*

            *Sifat Dari Nama dan Tanggal Lahir*
         
  ----------------------------------
         Nama ${h}
  ----------------------------------
*HR-WhatsApp © 2020* 
`
        );
});
  }

 else if (msg.body.startsWith("!yt ")) {
const url = msg.body.split(" ")[1];
const { exec } = require('child_process');

var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

const ytdl = require("ytdl-core")
if(videoid != null) {
   console.log("video id = ",videoid[1]);
} else {
    msg.reply("Videonya gavalid gan.");
}
msg.reply(" Tunggu sebentar kak .. Lagi di proses ☺");
ytdl.getInfo(videoid[1]).then(info => {
if (info.length_seconds > 300){
msg.reply("terlalu panjang.. \n sebagai gantinya \n kamu bisa klik link dibawah ini \π \n "+ info.formats[0].url)
}else{

console.log(info.length_seconds)

function os_func() {
    this.execCommand = function (cmd) {
        return new Promise((resolve, reject)=> {
           exec(cmd, (error, stdout, stderr) => {
             if (error) {
                reject(error);
                return;
            }
            resolve(stdout)
           });
       })
   }
}
var os = new os_func();

os.execCommand('ytdl ' + url + ' -q highest -o mp4/'+ videoid[1] +'.mp4').then(res=> {
    var media = MessageMedia.fromFilePath('mp4/'+ videoid[1] +'.mp4');
chat.sendMessage(media);
}).catch(err=> {
    console.log("os >>>", err);
})

}
});

 }
   else if (msg.body == "donasi" ||
    msg.body === "donasi ") {
    // Send a new message to the same chat
    msg.reply(`
📢 Support HR WhatsApp
    _Terimakasih telah menggunakan layanan bot kami saat ini.. kami telah membuat layanan Fitur Donasi untuk support HR WhatsApp Bot agar tetap berjalan.. donasi tersebut kami pakai untuk perpanjang server setiap bulannya._
  • *DANA* : 081246114524
  • *GOPAY* : 081246114524
  • *Pulsa Telkomsel* : 081246114524

Contact Admin Via WhatsApp : wa.me/6281246114524

*HR WhatsApp Bot © 2020*`);
  }
     else if (msg.body == "!rules" ||
    msg.body === "rules ") {
    // Send a new message to the same chat
    msg.reply(`
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!rules*

-=[ RULES HR BOT ]=-

• *Jangan spam bot ..* 
• *Jangan rusuh kalo bot gaaktif*
• *Jangan telfon / vc bot nya ..*
     ( _auto block_ )
• *Jangan req yang aneh aneh ..*
  _seperti mendownload video ber jam jam_
  
• *Sesuai kan perintah dengan formatnya..*

_salah format dan bot error = block_

Konsekuensi :

 Melanggar rules bot akan keluar 
atau member yang nge rusuh harus di kick 


Rules ini untuk kenyamanan semua yang memakai
bot ini


  `);
  }
	else if (msg.body == "!randomhentai") {
const cheerio = require('cheerio');
const request = require('request');

const { exec } = require("child_process");
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'https://api.computerfreaker.cf/v1/hentai',
 
},function(error, response, body){
    let $ = cheerio.load(body);
    var d = JSON.parse(body);
console.log(d.url); 
exec('wget "' + d.url + '" -O ok.jpg', (error, stdout, stderr) => {
  var media = MessageMedia.fromFilePath('ok.jpg');

  msg.reply(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
});
}
	else if (msg.body == "!randomanime" ){
    const imageToBase64 = require('image-to-base64');
    var items = ["anime aesthetic", "anime cute", "anime", "kawaii anime"];
    var cewe = items[Math.floor(Math.random() * items.length)];
    var url = "http://api.fdci.se/rep.php?gambar=" + cewe;
    
    request.get({
      headers: {'User-Agent':'Mozilla/5.0 (X11; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0'},
      url:     url,
    },function(error, response, body){
        
      var b = JSON.parse(body);
    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Whoaaaa gambar di temukan 😲` });
            }
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )
    
    });
    }
  else if (msg.body.startsWith("!sendto ")) {
    // Direct send a new message to specific id
    let number = msg.body.split(" ")[1];
    let messageIndex = msg.body.indexOf(number) + number.length;
    let message = msg.body.slice(messageIndex, msg.body.length);
    number = number.includes("@c.us") ? number : `${number}@c.us`;
    let chat = await msg.getChat();
    chat.sendSeen();
    client.sendMessage(number, message);
  }
  else if (msg.body == "Iya?" ||
    msg.body === "Iya?") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, "Gabut bangettt sihhh.. 🤭");
  }
  else if (msg.body == "save euy" || msg.body == "save donk" || msg.body == "Save euy" || msg.body == "Save donk") {
    client.sendMessage(msg.from, "Gas keun, ini chat ke sini aja -> wa.me/6281246114524, itu akun real ku ^_^")
  }
  else if (msg.body == "kamu bot?") {
    client.sendMessage(msg.from, "y")
  }
 else if (msg.body == "p" ||
    msg.body === "P") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, "Iya?");
  } else if (msg.body == "Assalamuallaikum" || msg.body == "Assalamu'alaikum" || msg.body == "mikum" || msg.body == "assalamuallaikum" || msg.body == "Assalamualaikum" || msg.body == "assalamualaikum") {
    client.sendMesssage(msg.from, "Waalaikumusallam");
  }else if (msg.body == "!menu") {
    msg.reply(`
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!menu*

Berikut daftar perintah yang bisa digunakan :     
• *.admin* : Menu Admin Grup
• *1* : Menu Utama
• *2* : Menu Music Download
• *3* : Menu Horoscape
• *4* : Menu Cek
• *5* : Tools Logo Maker
• *6* : Menu Lainnya
• *donasi* : Support HR WhatsApp Agar Tetap Aktif
`);

}
else if (msg.body == ".admin") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*

-=[ 🚫 Menu Admin Grup 🚫 ]=-

• *!subject* = Ganti nama grup.
• *!kick* = Kick member grup.
• *!promote* = Promote admin grup.
• *!demote* = Menurunkan admin group.
• *!add* = Menambah member group.
• *!deskripsi* = Ganti deskripsi grup.

✨ _Harap Diketahui, Fitur Ini Hanya Bisa Berfungsi Jika Saya Dijadikan Admin Di Grup Ini_.

*HR WhatsApp Bot © 2020*
 `);
 }
 
 else if (msg.body == "1") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*

• *!quotes* : Melihat quotes dari tokoh terkenal

• *!wait* : Menampilkan informasi anime dengan mengirim gambar dengan caption !wait

• *!brainly* : Menampilkan jawaban yang terdapat pada brainly.
contoh : !brainly siapa penemu motor

• *!translate* : Menerjemahkan kedalam bahasa yang di inginkan
 contoh : _!translate [en] kamu mau jadipacar aku ga sayang ?_
 _untuk code bahasa bisa di cek dengan perintah *#codebahasa*

• *!tts* : Mengubah teks kedalam suara / teks to speech
 contoh : _!tts kamu mau jadipacar aku ga sayang ?_
 
• *!lirik* : Mencari lirik lagu
contoh (Jika mengetahui nama artis) : !lirik alan walker - faded
contoh (Jika tidak mengetahui nama artis) : !lirik - faded
`);
 }
else if (msg.body == "2") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*

• *!play* Request Judul Lagu

• *!yt* : Mendownload video dari youtube
contoh : !yt https://youtu.be/K9jR4hSCbG4

• *!ytmp3* : Mendownload mp3 dari youtube
contoh : !ytmp3 https://youtu.be/xUVz4nRmxn4

• *!fb* : Mendownload video dari facebook
contoh : !fb url

• *!ig* : Mendownload media dari instagram
contoh : !ig url

`);
}
else if (msg.body == "bmzt") {
    msg.reply(`
Nama : *AZ-WhatsApp Bot*
Dibuat Oleh : *Alif Putra Darmawan*

-=[ 🎶 Download Music 🎶 ]=-

• *!play* Request Judul Lagu
• *!ytmp3* Link Video Music Youtube

📣 _Dilarang Request Lagu Lebih Dari 1 Jam, Demi Kebaikan Bersama :)_

*AZ WhatsApp Bot © 2020*
`);
} 

else if (msg.body == "6") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*

• *!randomanime*  : gambar anime random
• *!randomhentai*  : gambar anime random
• *!ptl1* : Penyegar Timeline cewek
• *!ptl2* : Penyegar Timeline cowok
• *!animehd*  : gambar anime random
• *!searchimage* : Cari Gambar

*HR WhatsApp Bot © 2020*
`);
} 

else if (msg.body == "3") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*

• *!nama* : Melihat arti dari nama kamu
 contoh : !nama Bondan

• *!sifat* : cari sifat berdasarkan nama dan tanggal lahir
contoh : !sifat [Bondan] 31-08-1999

• *!sial* : Check hari apes mu berdasarkan tanggal lahir.
contoh : !sial 17 08 1945

• *!pasangan* : Check kecocokan jodoh
 contoh : !pasangan Dimas & Dinda
`);
} 
else if (msg.body == "5") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*

-=[ 🔥 Generate Logo Maker 🔥 ]=-

• *!glowtext* Namamu
• *!pubg* Namamu
• *!galaxy* Namamu
• *!galaxy1* Namamu
• *!neon* Namamu
• *!hunter* Namamu
• *!dragon* Namamu
• *!aldous* Namamu
• *!tatto* Namamu
• *!goldplay* Namamu
• *!arum* Namamu
• *!elloin* Namamu
• *!spop* Namamu
• *!omega* Namamu
• *!prepayer* [TEXT1] [TEXT2]
• *!lolmaker* [HR WhatsApp Bot] NAMAMU
• *!over* [HR WhatsApp Bot] NAMAMU
• *!anmaker* [HR WhatsApp Bot ] TEXTMU
• *!marvel* [NAMAMU] VVIP-HR
• *!pornhub* [TEXT1] TEXT2
• *!space* [TEXT1] TEXT2
• *!love* [NAMA1] NAMA2

✨ Note : Dilarang Menggunakan Karakter Emoticon Atau Symbol Dalam Pembuatan Logo Maker Bot Ini.

*HR WhatsApp Bot © 2020*
`);
} 

else if (msg.body == "!test") {
msg.reply(" Hallo silahkan reply pesan ini dan sebutkan umur kamu \n\n dengan format *umur(spasi) umur* \n contoh *umur 21*");

}else if (msg.body.startsWith('umur ')){
var umur = msg.body.split(" ")[1];
if (umur < 18){
msg.reply(" Hallo umur kamu belum cukup untuk menampilkan menu ini");
}else{

 client.sendMessage(msg.from,  `
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*

 • *!randomhentai* = untuk melihat gambar anime secara random
 
• *!nh*  kode = untuk melihat info kode nhentai 
 
• *!doujinshi* = untuk mendownload manga dalam bentuk file pdf
 
 `
);
}
}
  else if (msg.body == "4") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*


• *!berita* : cek berita Indonesia
• *!fakta*  : fakta random
• *!pantun*  : random pantun
    `);
  }
  else if (msg.body == "#codebahasa") {
    msg.reply(`
Nama : *HR-WhatsApp Bot*
Dibuat Oleh : *Hendra*
Versi : *1.2*

  Bahasa                Code
######               #####
English                 |  en
Esperanto            |  eo
Estonian              |  et
Finnish                |  fi
French                 |  fr
Frisian                 |  fy
Galician               |  gl
Georgian              |  ka
German               |  de
Greek                   |  el
Gujarati               |  gu
Haitian Creole    |  ht
Hausa                  |  ha
Hawaiian            |  haw (ISO-639-2)
Hebrew               |  he or iw
Hindi                   |  hi
Hmong                |  hmn (ISO-639-2)
Hungarian          |  hu
Icelandic             |  is
Igbo                     |  ig
Indonesian         |  id
Irish                     |  ga
Italian                  |  it
Japanese             |  ja
Javanese              |  jv
Kannada              |  kn
Kazakh                 |  kk
Khmer                  |  km
Kinyarwanda      |  rw
Korean                 |  ko
Kurdish               |  ku
Kyrgyz                |  ky
Lao                      |  lo
Latin                   |  la
Latvian               |  lv
Lithuanian         |  lt
Luxembourg     |  lb
Macedonian      |  mk
Malagasy           |  mg
Malay                 |  ms
Malayalam        |  ml
Maltese               |  mt
Maori                  |  mi
Marathi               |  mr
Myanmar.          |  my
Nepali                 |  ne
Norwegian          |  no
Nyanja.               |  ny
Odia (Oriya)        |  or
Pashto                |  ps
Persian               |  fa
Polish                 |  pl
Portuguese.        |  pt
Punjabi               |  pa
Romanian           |  ro
Russian               |  ru
Samoan               |  sm
Scots Gaelic        |  gd
Serbian               |  sr
Sesotho               |  st
Shona                 |  sn
Sindhi                 |  sd
Slovak                 |  sk
Slovenian            |  sl
Somali                 |  so
Spanish               |  es
Sundanese          |  su
Swahili                |  sw
Swedish               |  sv
Tagalog.               |  tl
Tajik                     |  tg
Tamil                    |  ta
Tatar                     |  tt
Telugu                  |  te
Thai                      |  th
Turkish                |  tr
Turkmen              |  tk
Ukrainian             |  uk
Urdu                      |  ur
Uyghur                  |  ug
Uzbek                    |  uz
Vietnamese          |  vi
Welsh                   |  cy
Xhosa                   |  xh
Yiddish                 |  yi
Yoruba                  |  yo
Zulu                      |  zu
      ` );
  } else if (msg.body == "out sana") {
    // Leave the group
    let chat = await msg.getChat();
    if (chat.isGroup) {
      chat.leave();
    } else {
      msg.reply("This command can only be used in a group!");
      msg.reply("This command can only be used in a group!");
    }
  } else if (msg.body.startsWith("!play ")) {
let axios = require('axios').default;

async function searchYoutube(keyword) {
    let request = await axios.get("https://www.youtube.com/results", {
        params: {
            "search_query": keyword,
            "disable_polymer": 1
        }
    });
    let body = request.data;
    if (body.substring(0,92) == '<!doctype html><html  style="font-size: 10px;font-family: Roboto, Arial, sans-serif;" lang="') {
        let page = String(body);
        let pageSource = page.split(",");
        let id = [];
        let idIndex = 0;
        for (let index in pageSource) {
            if (pageSource[index].substring(0, 10) == '"videoId":' && pageSource[index].length == 23) {
                idIndex ++;
                if (idIndex % 2) {
                    id.push(pageSource[index].substring(11, pageSource[index].length - 1));
                };
            };
        };
        return id;
    }
    else {
        let page = String(body);
        let pageSource = page.split(" ");
        let id = [];
        let idIndex = 0;
        for (let index = 0; index<pageSource.length; index+=1) {
            element = pageSource[index];
            if (element.substring(0,15) == 'href="/watch?v='  && element.length == 27) {
                idIndex++;
                if (idIndex % 2) {
                    id.push(element.substring(15, element.length -1));
                };
            };
        };
        return id;
    };
};
var hh = msg.body.split("!play ")[1];
var keyword = hh.replace(/ /g, "+");
//////////Calling Async Function//////////
(async () => {

    index = 0

    result = await searchYoutube(keyword);
    console.log(result[index])
    var YoutubeMp3Downloader = require("youtube-mp3-downloader");
console.log(result[index]);
//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "ffmpeg", 
    "outputPath": "./mp3",    // Where should the downloaded and en>
    "youtubeVideoQuality": "highest",       // What video quality sho>
    "queueParallelism": 100,                  // How many parallel down>
    "progressTimeout": 2000                 // How long should be the>
});

//Download video and save as MP3 file
YD.download(result[index]);

YD.on("finished", function(err, data) {


const musik = MessageMedia.fromFilePath(data.file);
msg.reply(` 
Nama : *HR WhatsApp Bot*
Dibuat Oleh : *Hendra*
Jenis Perintah : *!play* Request Lagu

_Harap diketahui, Demi Kepentingan Bersama! Tolong Jangan Request Yang Aneh Aneh ataupun Request Dengan Durasi 1-3 Jam. karena Akan Mengakibatkan Bot Otomatis Mati._

🔉  *${data.videoTitle}* 
`);
 msg.reply(musik);
});
YD.on("progress", function(data) {
});
})();
}

});
