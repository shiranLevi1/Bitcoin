let IntervalId;
let selectedCoins = [];
let coinMoreInfoMap = new Map();
let coins = [];

// all coins upload outo

$("#loader").show();
$.get("https://api.coingecko.com/api/v3/coins").then(
    function (results) {
        coins = results;
        showAllCoins();
        $("#loader").hide();

    }).catch((e) => {
        console.error(e);
        alert("error!");
    });

function showAllCoins() {
    for (let index = 0; index < coins.length; index++) {
        showCoinCard(coins[index]);
        onMoreInfoClicked(coins[index].id);
    }
    toggleTrueSelectedCoins();
}

function showCoinCard(coin) {
    $("#mainContainer").append(`
                <div id="${coin.symbol.toUpperCase()}" class="card coinCardWrap">
                    <label class="switch">
                        <input type="checkbox" id="check${coin.symbol.toUpperCase()}" onchange="onToggleSwitchClicked(this, '${coin.symbol.toUpperCase()}')">
                        <span class="slider round"></span>
                    </label>

                    <div class="coinCardDiv">
                        <h5 class="coinTitle">${coin.symbol.toUpperCase()}</h5>
                        <span class="coinName">${coin.name}</span>
                        <br>
                        <button class="coinCardBtn" data-toggle="collapse" id="moreInfo${coin.id}" data-target="#${coin.id}">More info <i class="fas fa-angle-double-right"></i></button>
                    </div>

                    <div class="collapse show">
                    <div class="card collapse in" id="${coin.id}">
                    <div id="loader${coin.id}">
                    <div class="infoLoader"></div>
                    </div>
                    </div>
                    </div>
                </div>`);
}

function onMoreInfoClicked(coinId) {
    $(`#moreInfo${coinId}`).click(function () {

        let moreInfoCoinFromMap = coinMoreInfoMap.get(coinId);

        if (!moreInfoCoinFromMap) {
            $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`).then(coinInfo => {
                saveMoreInfoCoinInCache(coinInfo, coinId);
                setTimeout(function () { coinMoreInfoMap.delete(coinId); }, 120000);
                moreInfoCoinFromMap = coinMoreInfoMap.get(coinId);
                showCardMoreInfoOnUI(coinId, moreInfoCoinFromMap);

            }).catch((e) => {
                console.error(e);
                alert("error!");
            })
        }
        else {
            showCardMoreInfoOnUI(coinId, moreInfoCoinFromMap);
        }
    });
}

function saveMoreInfoCoinInCache(coinInfo, coinId) {
    let img = coinInfo.image.small;
    let ils = coinInfo.market_data.current_price.ils;
    let usd = coinInfo.market_data.current_price.usd;
    let eur = coinInfo.market_data.current_price.eur;

    let coinMoreInfo = { img, ils, usd, eur };

    coinMoreInfoMap.set(coinId, coinMoreInfo);
}

function showCardMoreInfoOnUI(coinId, coin) {
    $(`#${coinId}.card`).html(`
        <img src="${coin.img}"><br>
        <div class="coinValue">
        <span class="coinValue"><i class="fas fa-shekel-sign"></i> ${coin.ils}</span><br>
        <span class="coinValue"><i class="fas fa-dollar-sign"></i> ${coin.usd}</span><br>
        <span class="coinValue"><i class="fas fa-euro-sign"></i> ${coin.eur}</span>
        </div`);
}

function onToggleSwitchClicked(currentChoice, coinSymbol) {
    resetErrorsDivs();

    let toggleId = currentChoice.id;
    let symbolCoinIndex = selectedCoins.indexOf(coinSymbol);

    if (symbolCoinIndex != -1) {
        selectedCoins.splice(symbolCoinIndex, 1);
    }

    else if (selectedCoins.length < 5) {
        selectedCoins.push(coinSymbol);
    }
    else {
        activModal(toggleId, coinSymbol);
    }
}

function activModal(toggleId, coinSymbol) {
    $("#modalContainer").addClass("modal-activ");
    $("#modalBody").empty();
    $(`#${toggleId}`).prop('checked', false);

    $("#modalBodyInstruction").html('To add the' + " " + coinSymbol.toUpperCase() + " " + 'coin, you must unselect one of the following:');
    let counterId = 0;

    for (let index = 0; index < selectedCoins.length; index++) {
        createSelectedCardForModal(selectedCoins[index], counterId);
        $(`#chosenToggle${counterId}`).prop('checked', true);
        $(`#chosenToggle${counterId}`).on('click', () => {
            let coinToRemove = selectedCoins.indexOf(selectedCoins[index]);
            let toggleToFalse = "check" + selectedCoins[index];

            selectedCoins.splice(coinToRemove, 1);
            selectedCoins.push(coinSymbol);

            $("#modalContainer").removeClass("modal-activ");

            $(`#${toggleToFalse}`).prop('checked', false);
            $(`#${toggleId}`).prop('checked', true);
        });

        counterId++
    }

    keepCurrentSelectionModalBtn();
}

function createSelectedCardForModal(selectedCoins, counterId) {
    $("#modalBody").append(`
    <div class="contentCard">
        <div class="selectedCardBody">
            <h6 class="selectedCoinName" class="card-title">${selectedCoins.toUpperCase()}</h6>
        </div>

        <label class="modalSwitch">
        <input type="checkbox" id="chosenToggle${counterId}">
        <span class="slider round"></span>
        </label>
    </div>`);
}

function keepCurrentSelectionModalBtn() {
    $("#keepChoicesBtn").click(function () {
        $("#modalContainer").removeClass("modal-activ");
    });
}

function toggleTrueSelectedCoins() {
    for (let index = 0; index < selectedCoins.length; index++) {
        $(`#check${selectedCoins[index]}`).prop('checked', true);
    }
}

function resetErrorsDivs() {
    $("#unselactenCoinsErrorDiv").html("");
    $("#searchErrorsDiv").html("");
}

// on home page click

$("#homePage").click(function () {
    showHomePage();
});

function showHomePage() {
    clearInterval(IntervalId);
    resetErrorsDivs();
    $("#mainContainer").empty();
    showAllCoins();
    toggleTrueSelectedCoins();
}

// on live report click

$("#liveReport").click(function () {
    resetErrorsDivs();

    if (isEmptySelectedCoinsArray()) {
        showHomePage();
        $("#unselactenCoinsErrorDiv").html("Please select up to 5 coins to display on the graph!");
    }
    else {
        $("#mainContainer").empty();
        $("#loader").show();

        let coinSelectedIndex0 = [];
        let coinSelectedIndex1 = [];
        let coinSelectedIndex2 = [];
        let coinSelectedIndex3 = [];
        let coinSelectedIndex4 = [];
        let coinKeysArray = [];

        IntervalId = setInterval(() => {
            getData();
        }, 2000);

        function getData() {
            let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins[0]},${selectedCoins[1]},${selectedCoins[2]},${selectedCoins[3]},${selectedCoins[4]}&tsyms=USD`
            $.get(url).then((coinsValue) => {
                $("#mainContainer").html(`<div id="chartContainer" style="height: 300px; width: 80%;"></div>`);

                let dateNow = new Date();
                let coinToShowOnGraph = 1;
                coinKeysArray = [];

                for (let key in coinsValue) {

                    if (coinToShowOnGraph == 1) {
                        coinSelectedIndex0.push({ x: dateNow, y: coinsValue[key].USD });
                        coinKeysArray.push(key);
                    }

                    if (coinToShowOnGraph == 2) {
                        coinSelectedIndex1.push({ x: dateNow, y: coinsValue[key].USD });
                        coinKeysArray.push(key);
                    }

                    if (coinToShowOnGraph == 3) {
                        coinSelectedIndex2.push({ x: dateNow, y: coinsValue[key].USD });
                        coinKeysArray.push(key);
                    }

                    if (coinToShowOnGraph == 4) {
                        coinSelectedIndex3.push({ x: dateNow, y: coinsValue[key].USD });
                        coinKeysArray.push(key);
                    }

                    if (coinToShowOnGraph == 5) {
                        coinSelectedIndex4.push({ x: dateNow, y: coinsValue[key].USD });
                        coinKeysArray.push(key);
                    }

                    coinToShowOnGraph++;
                }
                createGraph();
                $("#loader").hide();

            });
        }

        function createGraph() {

            let chart = new CanvasJS.Chart("chartContainer", {
                exportEnabled: true,
                animationEnabled: false,

                title: {
                    text: "Crypto Coins Currencies Real-Time in $USD"
                },
                axisX: {
                    title: "Time",
                    valueFormatString: "HH:mm:ss",
                },
                axisY: {
                    title: "Currency Value",
                    suffix: "$",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                    includeZero: true,
                },

                toolTip: {
                    shared: true
                },
                data: [{
                    type: "spline",
                    name: coinKeysArray[0],
                    showInLegend: true,
                    xValueFormatString: "HH:mm:ss",
                    dataPoints: coinSelectedIndex0,
                },
                {
                    type: "spline",
                    name: coinKeysArray[1],
                    showInLegend: true,
                    xValueFormatString: "HH:mm:ss",
                    dataPoints: coinSelectedIndex1,
                },
                {
                    type: "spline",
                    name: coinKeysArray[2],
                    showInLegend: true,
                    xValueFormatString: "HH:mm:ss",
                    dataPoints: coinSelectedIndex2,
                },
                {
                    type: "spline",
                    name: coinKeysArray[3],
                    showInLegend: true,
                    xValueFormatString: "HH:mm:ss",
                    dataPoints: coinSelectedIndex3,
                },
                {
                    type: "spline",
                    name: coinKeysArray[4],
                    showInLegend: true,
                    xValueFormatString: "HH:mm:ss",
                    dataPoints: coinSelectedIndex4,
                }]
            });

            chart.render();
        }
    }
});

function isEmptySelectedCoinsArray() {
    if (selectedCoins.length == 0) {
        return true;
    }

    return false;
}

// on About page click

$("#aboutPage").click(() => {
    clearInterval(IntervalId);
    resetErrorsDivs();
    $("#mainContainer").empty();
    $("#mainContainer").html(`
    <div id="aboutDiv">
    <h2> Welcom! </h2>
    <br>
    <span> My name is Shiran Levi, </span>
    <br>
    <span> <span class="bolderTextAboutPage"> Cryptocurrency </span> owner. </span>
    <br>
    <span> A 25 years old, </span>
    <br>
    <span> Born in Rehovot, lives in Karne Shomron. </span>
    <br>
    <br>

    <p> I started my carrer as a make-up artist i liked it, but all it was just a hobby.</P>
    <p> Then covid-19 showed up, and made me think about my future.</P>
    <p> So i started to study Web Development, and eventually to create <span class="bolderTextAboutPage"> Cryptocurrency </span>.</P>
    </div>`);
});

// can not provide anything but A-Z letters

$("#coinSearch").on("keypress", (e) => {
     var key = String.fromCharCode(!e.charCode ? e.which : e.charCode);
      if (!/^[A-Z]+$/i.test(key)) {
          e.preventDefault();
   }
});

// on Search click

$("#searchBtn").click(() => {
    clearInterval(IntervalId);
    resetErrorsDivs();

    let coinSearch = $("#coinSearch").val().toUpperCase();

    $("#coinSearch").val("");

    if (isEmptyField(coinSearch)) {
        $("#searchErrorsDiv").html("Please enter a coin name");
    }
    else {
        for (let index = 0; index < coins.length; index++) {
            if (coins[index].symbol.toUpperCase() == coinSearch) {
                $("#mainContainer").empty();
                showCoinCard(coins[index]);
                toggleTrueSelectedCoins();
                onMoreInfoClicked(coins[index].id);
                resetErrorsDivs();
                return;
            }
            else {
                $("#searchErrorsDiv").html("Could not find a matching coin");
            }
        }
    }
});

function isEmptyField(field) {
    if (field.trim() == "" || field.trim() == null) {
        return true;
    }

    return false;
}

// fixed-top navbar

document.addEventListener("DOMContentLoaded", function () {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 85) {
            document.getElementById("navbar_top").classList.add("fixed-top");
            $("#navbar_top").css("opacity", "1")
            // add padding top to show content behind navbar
            navbar_height = document.querySelector(".navbar").offsetHeight;
            document.body.style.paddingTop = navbar_height + "px";
        } else {
            document.getElementById("navbar_top").classList.remove("fixed-top");
            $("#navbar_top").css("opacity", "0.8")

            // remove padding top from body
            document.body.style.paddingTop = "0";
        }
    });
});

