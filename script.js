let account;

let maxAmountCanBuy = 3;

let mintIndexForSale = 0;
let mintLimitPerBlock = 0;
let mintLimitPerSale = 0;
let mintStartBlock = 0;
let maxAmount = 0;
let mintPrice = 0;

let blockNumber = 0;
let isBlockCount = false;

let amountCount = document.querySelector(".amount");
let connectWallet = document.querySelector(".connect_wallet");
let btnPlus = document.querySelector(".btn_plus");
let btnMinus = document.querySelector(".btn_minus");
let totalPrice = document.querySelector(".price_count");

btnPlus.addEventListener("click", function () {
  amountCount.value++;
  totalPrice.innerHTML =
    Math.floor(caver.utils.fromPeb(mintPrice, "KLAY")) * amountCount.value +
    " KLAY";
  btnMinus.classList.remove("untouchable");
  if (amountCount.value >= maxAmountCanBuy) {
    amountCount.value = maxAmountCanBuy;
    totalPrice.innerHTML =
      Math.floor(caver.utils.fromPeb(mintPrice, "KLAY")) * amountCount.value +
      " KLAY";
    btnPlus.classList.add("untouchable");
  }
});

btnMinus.addEventListener("click", function () {
  amountCount.value--;

  totalPrice.innerHTML =
    Math.floor(caver.utils.fromPeb(mintPrice, "KLAY")) * amountCount.value +
    " KLAY";
  btnPlus.classList.remove("untouchable");
  if (amountCount.value <= 1) {
    amountCount.value = 1;

    totalPrice.innerHTML =
      Math.floor(caver.utils.fromPeb(mintPrice, "KLAY")) * amountCount.value +
      " KLAY";
    btnMinus.classList.add("untouchable");
  }
});

async function connect() {
  const accounts = await klaytn.enable();

  if (!accounts) {
    alert("KaiKas 확장 프로그램을 활성화 해주세요!");
    return;
  }

  if (klaytn.networkVersion === 8217) {
    console.log("메인넷");
  } else if (klaytn.networkVersion === 1001) {
    console.log("테스트넷");
  } else {
    alert("클레이튼 네트워크에 연결되지 않았습니다!");
    return;
  }

  account = accounts[0];
  caver.klay.getBalance(account).then(function (balance) {
    document.querySelector(".wallet_addr").innerHTML =
      account.substr(0, 8) + "...";
    document.querySelector(".balance_title").innerHTML =
      "Balance(" + account.substr(0, 8) + "...)";
    document.querySelector(".balance_count").innerHTML =
      Math.floor(caver.utils.fromPeb(balance, "KLAY")) + " KLAY";
  });

  await check_status();
}

async function check_status() {
  const projectContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);

  blockNumber = await caver.klay.getBlockNumber();
  document.querySelector(".currentblock_desc").innerHTML = "#" + blockNumber;
  calcBlockNumber();

  await projectContract.methods
    .mintingInformation()
    .call()
    .then(function (res) {
      mintIndexForSale = parseInt(res[1]);
      mintLimitPerBlock = parseInt(res[2]);
      mintLimitPerSale = parseInt(res[3]);
      mintStartBlock = parseInt(res[4]);
      maxAmount = parseInt(res[5]);
      mintPrice = parseInt(res[6]);

      maxAmountCanBuy = mintLimitPerBlock;

      document.querySelector(".mintingstart_desc").innerHTML =
        '<span class="highlight">' + "#" + mintStartBlock + "</span>";
      document.querySelector(".pertransaction_desc").innerHTML =
        '<span class="small">Max </span>' + mintLimitPerBlock;
      document.querySelector(".perwallet_desc").innerHTML =
        '<span class="small">Max </span>' + mintLimitPerSale;
      document.querySelector(".remaining_desc").innerHTML =
        '<span class="highlight">' +
        (maxAmount - mintIndexForSale + 1) +
        '</span><span class="small"> / ' +
        maxAmount +
        "</span>";

      if (amountCount.value <= 1) {
        amountCount.value = 1;
      } else if (amountCount.value >= mintLimitPerBlock) {
        amountCount.value = mintLimitPerBlock;
      }
      document.querySelector(".price_count").innerHTML =
        Math.floor(caver.utils.fromPeb(mintPrice, "KLAY")) * amountCount.value +
        " KLAY";
    })
    .catch(function (err) {
      console.log(err);
    });
}

function calcBlockNumber() {
  if (!isBlockCount) {
    setInterval(function () {
      blockNumber += 1;
      document.querySelector(".currentblock_desc").innerHTML =
        "#" + blockNumber;
    }, 1000);
    isBlockCount = true;
  }
}

async function publicMint() {
  const accounts = await klaytn.enable();

  if (!accounts) {
    alert("KaiKas 확장 프로그램을 활성화 해주세요!");
    return;
  }

  if (klaytn.networkVersion === 8217) {
    console.log("메인넷");
  } else if (klaytn.networkVersion === 1001) {
    console.log("테스트넷");
  } else {
    alert("클레이튼 네트워크에 연결되지 않았습니다!");
    return;
  }

  const projectContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
  const amount = amountCount.value;

  await check_status();

  if (maxAmount + 1 <= mintIndexForSale) {
    alert("모든 물량이 소진되었습니다.");
    return;
  } else if (blockNumber <= mintStartBlock) {
    alert("아직 민팅이 시작되지 않았습니다.");
    return;
  }

  const total_value = BigNumber(amount * mintPrice);

  try {
    const gasAmount = await projectContract.methods
      .publicMint(amount)
      .estimateGas({
        from: account,
        gas: 6000000,
        value: total_value,
      });
    const result = await projectContract.methods.publicMint(amount).send({
      from: account,
      gas: gasAmount,
      value: total_value,
    });

    if (result != null) {
      alert("민팅에 성공하였습니다.");
      connect();
    }
  } catch (err) {
    console.log(err);
    alert("민팅에 실패하였습니다.");
  }
}
