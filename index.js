const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const endpoint = "https://api.trade.mandala.exchange/api/3/public/price/ticker";
const ticker_to_watch = "MDXUSDT"; // mdx to the moon!

bot.on("message", async (ctx) => {
	// get username
	const username = ctx.message.from.username;
	console.log("requested price by", username);
	if (ctx.message.text === "/price") {
		const response = await fetch(endpoint).then((response) => {
			return response.json();
		});
		const mdx_ticket = response[ticker_to_watch];
		ctx.reply(`MDX price is: ${mdx_ticket.price}`);
	}
});

bot.launch();
