const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.options("*", cors()); //Allow all requests orgin

const PORT = process.env.PORT || 3000;

const apiKey = "MB9A94BKB3R6SWPAEWRHZGD88M7S7JDBPB"; //Etherscan API key
const contractAddress = "0xba8a621b4a54e61c442f5ec623687e2a942225ef"; //Contract address of token
const divisor = 18; //Decimal of token
const maxSupply = 100000000; //Max supply of token

let originalText = "0x8270879488b9998c324ac235c904f97a30f6738c"; //List of address renoved from circulation supply, separate eacch by comma

let newText = originalText.replace(/ /g, "");

let addressList = newText.split(",");

const totalSupply = async (req, res) => {
  const api_url = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${apiKey}`;
  try {
    const response = await axios.get(api_url);

    const response_data = response.data;
    const final_res = response_data.result / 10 ** divisor;
    res.status(200).format({
      "text/plain"() {
        res.end(final_res.toFixed(3));
      },
    });
  } catch (_e) {
    //console.log(_e);
    res.status(200).format({
      "text/plain"() {
        res.end("Server error");
      },
    });
  }
};

const otherTokens = async (addr) => {
  const api_url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${addr}&tag=latest&apikey=${apiKey}`;
  try {
    const response = await axios.get(api_url);

    const response_data = response.data;
    const final_res = response_data["result"] / 10 ** divisor;
    return final_res;
  } catch (_e) {
    console.log(_e);
    return 0;
  }
};

const circulatingSupply = async (req, res) => {
  const api_url = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${apiKey}`;
  let developerSupply = [];
  try {
    const response = await axios.get(api_url);
    const burnCoins = await otherTokens(
      "0x000000000000000000000000000000000000dead"
    ); //Token in burn wallet
    const response_data = response.data["result"] / 10 ** divisor;

    if (newText.length) {
      for (key in addressList) {
        let _newBal = await otherTokens(addressList[key]);

        developerSupply.push(_newBal);
      }
    } else {
      const _tokens = 0;
    }

    let _tokens = developerSupply.reduce((n1, n2) => {
      return n1 + n2;
    });

    const final_res = response_data - burnCoins - _tokens;
    res.status(200).format({
      "text/plain"() {
        res.end(final_res.toFixed(3));
      },
    });
  } catch (_e) {
    console.log(_e);
    res.status(200).format({
      "text/plain"() {
        res.end("Server error");
      },
    });
  }
};

app.get("/", async (req, res) => {
  await res.json({
    contractAddress: contractAddress,
    totalSupply: maxSupply,
    decimal: divisor,
  });
});
app.get("/total-supply", totalSupply);
app.get("/circulating-supply", circulatingSupply);

app.use(async (req, res, next) => {
  try {
    res.status(404).format({
      "text/plain"() {
        res
          .status(404)
          .end(
            `Endpoint not found, get API form https://www.fiverr.com/share/98b4kA`
          );
      },
    });
  } catch (error) {
    return res.status(500).end("Server error");
  }
});

app.listen(PORT, function () {
  //console.log("server running on port" + PORT, "http://localhost:" + PORT);
});
