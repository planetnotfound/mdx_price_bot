const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// const priceEndpoint =
// 	"https://api.trade.mandala.exchange/api/3/public/price/ticker";
const endpoint =
	"https://api.trade.mandala.exchange/api/3/public/ticker/MDXUSDT";
const ticker_to_watch = "MDXUSDT"; // mdx to the moon!
const tradesEndpoint =
	"https://api.trade.mandala.exchange/api/3/public/trades/MDXUSDT";

let can_request_price = true;
let cached_mdx_ticker = {};

/**
 * Generates the price information message
 */
async function generatePriceMessage(mdx_ticker) {
	try {
		const tradeNumber = await mdxTradeNumber();

		let message = `🤖 *${ticker_to_watch} Price Information 🤖*\n`;
		message += `\nLast Price: \`$${mdx_ticker.last}\``;
		message += `\n24h MDXT Volume: \`${mdx_ticker.volume} MDX\``;
		message += `\n24h USDT Volume: $\`${Number.parseFloat(
			mdx_ticker.volume_quote,
		).toFixed(2)} \``;
		message += `\n24h High: \`$${mdx_ticker.high}\``;
		message += `\n24h Low: \`$${mdx_ticker.low}\``;
		message += `\nTrades in the last 6 hours: \`${tradeNumber}\` `;

		message += "\n\nEnjoying the bot? Feedback & Donations: @jan\\_may!";

		return message;
	} catch (error) {
		console.error("An error has occurred.", error);
		// send a message to the maintainer

		sendMessageInGroup(error);
		return "Uh oh...\n`Something went wrong 😵`\n\n*Error fetching trading information. Something went wrong on the bots or API side. We will be back soon, bot maintainer has been notified!*";
	}
}

function sendMessageInGroup(error) {
	try {
		bot.telegram.sendMessage(
			process.env.GROUP_ID,
			`Price bot reported problem at ${Date.now()}. Please check the logs. Error information: ${error}`,
			{
				parse_mode: "Markdown",
			},
		);
	} catch (error) {
		console.error("Error sending message to group", error);
	}
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
				sendMessageInGroup();
				return "Uh oh...\n`Something went wrong 😵`\n\n*Error fetching trading information. Something went wrong on the bots or API side. We will be back soon, bot maintainer has been notified!*";
			}
			cached_mdx_ticker = mdx_ticker;
			setTimeout(() => {
				can_request_price = true;
			}, 5000);
			return generatePriceMessage(cached_mdx_ticker);
		} catch (error) {
			console.error(error);
			sendMessageInGroup();
			return "Uh oh...\n`Something went wrong 😵`\n\n*Error fetching trading information. Something went wrong on the bots or API side. We will be back soon, bot maintainer has been notified!*";
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
		sendMessageInGroup();
		const welcomeMessage = `Welcome to the unofficial Mandala Exchange Price Bot, @${username}!\n\nYou can use /price to get the current price of MDXUSDT. This bot is not affiliated with Mandala Exchange and is being maintained by the community. If you have any questions or feedback, please reach out to @jan_may.`;
		// get the chat id
		ctx.reply(welcomeMessage);
	}
});

/**
 * Number of trades in the last 24 hours
 *
 * @param {*} timeframe, default value is 1 hour
 */
async function mdxTradeNumber(timeframe = 3600000 * 6) {
	const mdx_trades = await fetch(
		`${tradesEndpoint}?from=${
			Date.now() - timeframe
		}&to=${Date.now()}&limit=1000&sort=DESC`,
	).then((responseTrades) => {
		return responseTrades.json();
	});

	return mdx_trades.length;
}

bot.launch();
