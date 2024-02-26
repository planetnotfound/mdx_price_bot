const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// const priceEndpoint =
// 	"https://api.trade.mandala.exchange/api/3/public/price/ticker";
const endpoint =
	"https://api.trade.mandala.exchange/api/3/public/ticker/MDXUSDT";
const ticker_to_watch = "MDXUSDT"; // mdx to the moon!

let can_request_price = true;
let cached_price = 0;
let cached_volume_usdt = 0;
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
			const mdx_ticker = response;
			cached_price = mdx_ticker.last;
			cached_volume_usdt = (mdx_ticker.volume * mdx_ticker.last).toFixed(2);
			can_request_price = false;
			setTimeout(() => {
				can_request_price = true;
			}, 5000);
			return `The current price of ${ticker_to_watch} is $${cached_price} with a volume of $${cached_volume_usdt}`;
		} catch (error) {
			console.error(error);
			return "Error fetching price. Please try again later. We are already working on it!";
		}
	} else {
		return `The current price of ${ticker_to_watch} is $${cached_price} with a volume of $${cached_volume_usdt}`;
	}
}

bot.on("message", async (ctx) => {
	// get username
	const username = ctx.message.from.username;
	if (ctx.message.text === "/price") {
		console.log("requested price by", username);
		const price = await requestThePrice();
		ctx.reply(price);
	}
	if (ctx.message.text === "/start") {
		console.log("greeted", username);
		ctx.reply(
			"Welcome to the unofficial Mandala Exchange Price Bot! You can use /price to get the current price of MDXUSDT. This bot is not affiliated with Mandala Exchange and is being maintained by the community. If you have any questions or feedback, please reach out to @jan_may.",
		);
	}
});

bot.launch();
