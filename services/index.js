const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");

const DOMAIN = process.env.DOMAIN || "";
const EMAIL = process.env.EMAIL || "";
const API_TOKEN = process.env.API_TOKEN;
const PROJECT_KEY = process.env.PROJECT_KEY;

const TOKEN = `Basic ${Buffer.from(`${EMAIL}:${API_TOKEN}`).toString(
	"base64"
)}`;
const BASE_URL = `https://${DOMAIN}.atlassian.net/rest/api/3`;

const headers = {
	Authorization: TOKEN,
	Accept: "application/json",
	"Content-Type": "application/json",
};

class Service {
	async getListIssueByProject() {
		const url = `${BASE_URL}/search?jql=project=${PROJECT_KEY}`;
		try {
			console.log("Step (1/4): Get issue list");
			const interval = this.loadingAnimation();
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			const listIssueId = json?.issues?.map((ele) => ele.id) || [];

			this.clearInterval(interval);
			return listIssueId;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachmentIdByIssueId(issueId) {
		const url = `${BASE_URL}/issue/${issueId}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			const listAttachmentId =
				json?.fields?.attachment?.map((ele) => ele.id) || [];

			return listAttachmentId;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachmentByListIssueId(listIssueId) {
		console.log("\rStep (2/4): Get attachment id list");
		const interval = this.loadingAnimation();
		let listAttachmentId = [];
		for (const issueId of listIssueId) {
			const temp = await this.getListAttachmentIdByIssueId(issueId);
			listAttachmentId = [...listAttachmentId, ...temp];
		}
		this.clearInterval(interval);
		return listAttachmentId;
	}

	async getAttachmentInfo(attachmentId) {
		const url = `${BASE_URL}/attachment/${attachmentId}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			return json;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachment(listAttachmentId) {
		console.log("Step (3/4): Get attachment list");
		const interval = this.loadingAnimation();
		const listAttachment = [];
		for (const attachmentId of listAttachmentId) {
			const temp = await this.getAttachmentInfo(attachmentId);
			listAttachment.push(temp);
		}
		this.clearInterval(interval);
		return listAttachment;
	}

	async downloadAttachment(listAttachment, path) {
		console.log("Step (4/4): Download attachment");
		let i = 0;
		const total = listAttachment.length;

		// create directory
		const directory = `${path}/${PROJECT_KEY}-${Date.now()}`;
		fs.mkdir(directory, { recursive: true }, (err) => {
			if (err) throw err;
		});

		for (const attachment of listAttachment) {
			try {
				request({ method: "GET", url: attachment.content, headers })
					.on("error", (error) => {
						console.log(attachment);
						console.error("Download ", error);
					})
					.pipe(fs.createWriteStream(`${directory}/${attachment.filename}`))
					.on("error", (error) => {
						console.error("Write file error:", error);
					});
			} catch (error) {
				console.error(error);
			}
			i++;
			// process.stdout.write(`Downloading (${i}/${total})`);
		}
		console.log(`%cDownload completed! (${i}/${total})`, "color: #bada55");
		return true;
	}

	loadingAnimation(text = "\rpending") {
		const chars = [".  ", ".. ", "...", " ..", "  .", "   "];
		let i = 0;
		return setInterval(function () {
			process.stdout.write(text + chars[i++]);
			i = i % chars.length;
		}, 200);
	}

	clearInterval(interval) {
		clearInterval(interval);
		process.stdout.clearLine(); // clear current text
		process.stdout.cursorTo(0); // move cursor to beginning of line
	}
}

module.exports = new Service();
