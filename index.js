const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// const priceEndpoint =
// 	"https://api.trade.mandala.exchange/api/3/public/price/ticker";
const endpoint =
	"https://api.trade.mandala.exchange/api/3/public/ticker/MDXUSDT";
const ticker_to_watch = "MDXUSDT"; // mdx to the moon!

let can_request_price = true;
let cached_mdx_ticker = {};

/**
 * Generates the price information message
 */
function generatePriceMessage(mdx_ticker) {
	let message = `*${ticker_to_watch} Price Information *\n`;
	message += `\nLast Price: \`$${mdx_ticker.last}\``;
	message += `\n24h MDXT Volume: \`${mdx_ticker.volume} MDX\``;
	message += `\n24h USDT Volume: $\`${parseFloat(
		mdx_ticker.volume_quote,
	).toFixed(2)} \``;
	message += `\n24h High: \`$${mdx_ticker.high}\``;
	message += `\n24h Low: \`$${mdx_ticker.low}\``;

	return message;
}

/**
 * Returns the price but throttles the request to 1 request every 5 seconds
 * @returns
 */
async function requestThePrice() {
	if (can_request_price) {
		try {
			const responsePrice = await fetch(endpoint).then((responsePrice) => {
				return responsePrice.json();
			});
			const mdx_ticker = responsePrice;
			if (!mdx_ticker.last) {
				console.error("Error fetching price", mdx_ticker);
				return "Error fetching price. Please try again later. We are already working on it!";
			}
			cached_mdx_ticker = mdx_ticker;
			setTimeout(() => {
				can_request_price = true;
			}, 5000);
			return generatePriceMessage(cached_mdx_ticker);
		} catch (error) {
			console.error(error);
			return "Error fetching price. Please try again later. We are already working on it!";
		}
	} else {
		return generatePriceMessage(cached_mdx_ticker);
	}
}

bot.on("message", async (ctx) => {
	// get username
	const username = ctx.message.from.username;
	if (ctx.message.text === "/price") {
		console.log("requested price by", username);
		const price = await requestThePrice();
		ctx.reply(price, {
			parse_mode: "Markdown",
		});
	}
	if (ctx.message.text === "/start") {
		console.log("greeted", username);
		const welcomeMessage = `Welcome to the unofficial Mandala Exchange Price Bot, @${username}!\n\nYou can use /price to get the current price of MDXUSDT. This bot is not affiliated with Mandala Exchange and is being maintained by the community. If you have any questions or feedback, please reach out to @jan_may.`;
		ctx.reply(welcomeMessage);
	}
});

bot.launch();
