const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const endpoint = "https://api.trade.mandala.exchange/api/3/public/price/ticker";
const ticker_to_watch = "MDXUSDT"; // mdx to the moon!

let can_request_price = true;
let cached_price = 0;
/**
 * Returns the price but throttles the request to 1 request every 5 seconds
 * @returns
 */
async function requestThePrice() {
	if (can_request_price) {
		try {
			const response = await fetch(endpoint).then((response) => {
				return response.json();
			});
			const mdx_ticket = response[ticker_to_watch];
			cached_price = mdx_ticket.price;
			can_request_price = false;
			setTimeout(() => {
				can_request_price = true;
			}, 5000);
			return `The current price of ${ticker_to_watch} is ${mdx_ticket.price}`;
		} catch (error) {
			return "Error fetching price. Please try again later. We are already working on it!";
		}
	} else {
		return `The current price of ${ticker_to_watch} is ${cached_price} CACHED`;
	}
}

bot.on("message", async (ctx) => {
	// get username
	const username = ctx.message.from.username;
	console.log("requested price by", username);
	if (ctx.message.text === "/price") {
		const price = await requestThePrice();
		ctx.reply(price);
	}
});

bot.launch();
