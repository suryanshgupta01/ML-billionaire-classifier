var Pic = null
// const baseURL = "http://127.0.0.1:5000"
const baseURL = "https://billionaire-classifier.onrender.com"
let health = "Unhealthy"
const times = 10
for (let i = 0; i < times; i++) {
    if(health=="Healthy"){
        break;
    }
    fetch(baseURL + "/healthy")
        .then(function (response) {
            return response.json();
        }).then((data) => {
            document.getElementById("health").innerHTML = data.health
            health = "Healthy"
        }).catch((err) => {
            console.log(err)
        })
}
var loadingDiv = document.getElementById('loading');

function showSpinner() {
    loadingDiv.style.visibility = 'visible';
}

function hideSpinner() {
    loadingDiv.style.visibility = 'hidden';
}
document.getElementById("file").addEventListener("change", function (event) {
    event.preventDefault();
    showSpinner()
    // var output = document.getElementById("file");
    // var data = output.files[0];
    // console.log(event.target.files[0])
    const reader = new FileReader();
    reader.onloadend = () => {
        Pic = reader.result;
        document.getElementById("inputimage").src = Pic
        document.getElementById('probability').innerHTML = "";
        document.getElementById("billionaire_pics").innerHTML = "";
        document.getElementById("billionaire").innerHTML = "";
        execute_classify(Pic);
        execute_gemini(Pic);
        // hideSpinner()
    };
    reader.readAsDataURL(event.target.files[0]);
});

func_cleaned_data = (data) => {
    cleaned_data = []
    for (var entry of data) {
        let maxi = Math.max(...entry.class_probability)
        if (maxi > 50) {
            cleaned_data.push(entry)
        }
    }
    return cleaned_data
}
// not waiting for the button to be clicked
// document.getElementById("submit").addEventListener("click", function (event) {
const execute_classify = (Pic) => {
    // event.preventDefault();
    var url = baseURL + "/classify_image";
    var formData = new FormData();
    formData.append('image_data', Pic);

    fetch(url, {
        method: 'POST',
        body: formData
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        // console.log(data)
        // data = data[0]
        cleaned_data = func_cleaned_data(data)
        var names = []
        for (const entry of cleaned_data) {
            var freshClass = capitalize(entry.class.replace('_', ' '))
            names.push(freshClass)
            filltable(freshClass, entry.class_probability)
        }
        if (names.length != 0) {
            document.getElementById("billionaire").innerHTML = names.join(" & ");
        } else {
            document.getElementById("billionaire").innerHTML = "No Billionaire Found. Try again with different picture!";
        }
        hideSpinner()
    });
}

function capitalize(word) {
    wordArr = word.split(' ')
    for (let i = 0; i < wordArr.length; i++) {
        wordArr[i] = wordArr[i][0].toUpperCase() + wordArr[i].slice(1);
    }
    return wordArr.join(' ')

}

document.getElementById("gemini").addEventListener("click", function (event) {
    event.preventDefault();
    if (!Pic) {
        alert("Please select an image first")
        return
    }
    execute_gemini(Pic);
})
execute_gemini = (Pic) => {
    document.getElementById("gemini").classList.toggle('nonclickable')
    var url = baseURL + "/fetch_gemini"
    var formData = new FormData();
    formData.append('image_data', Pic);
    var text = "";
    var index = 0;
    const textContainer = document.getElementById("info");
    textContainer.innerHTML = "";

    fetch(url, {
        method: 'POST',
        body: formData
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function (data) {
            // console.log(data)
            text = data.gemini_response;
            updateText();
            document.getElementById("gemini").classList.toggle('nonclickable')
        }).catch(function (error) {
            console.log('There was a problem with the fetch operation:', error);
        });
    function updateText() {
        if (index < text.length) {
            const span = document.createElement("span");
            span.textContent = text[index];
            textContainer.appendChild(span);

            const cursor = document.createElement("div");
            cursor.classList.add("cursor");
            textContainer.appendChild(cursor);

            index++;
            // Remove the cursor after a short delay (adjust as needed)
            setTimeout(() => {
                textContainer.removeChild(cursor);
            }, 10);
            requestAnimationFrame(updateText);
        }
    }

};

const allbillionaires = document.getElementById("allbillionaires")
const dict = new Map([
    ["bernard arnault", 0],
    ["bill gates", 1],
    ["elon musk", 2],
    ["gautam adani", 3],
    ["jeff bezos", 4],
    ["mark zuckerberg", 5],
    ["mukesh ambani", 6],
    ["warren buffett", 7]
]);

dict.forEach((value, key) => {
    // console.log(value, key)
    var url = "https://en.wikipedia.org/wiki/"
    const single = document.createElement("div");
    single.classList.add("make_column");
    const image = document.createElement("img");
    const link = document.createElement("a");
    link.href = url + capitalize(key.replace('_', ' '));
    link.setAttribute('target', '_blank');
    link.appendChild(image);
    const name = document.createElement("span");
    image.src = "./testing_images/" + key + " (1).jpg";
    name.textContent = capitalize(key);
    single.appendChild(link);
    single.appendChild(name);
    allbillionaires.appendChild(single);
})


const tables = document.getElementById("probability");
const filltable = (class1, prob) => {
    const image = document.createElement("img");
    image.src = "./testing_images/" + class1 + " (1).jpg";
    document.getElementById("billionaire_pics").appendChild(image);
    const table = document.createElement("table");
    const tableHead = document.createElement("thead");
    const tableRow = document.createElement("tr");
    const nameHeader = document.createElement("th");
    const probabilityHeader = document.createElement("th");

    nameHeader.textContent = "Name";
    probabilityHeader.textContent = "Probability";

    tableRow.appendChild(nameHeader);
    tableRow.appendChild(probabilityHeader);
    tableHead.appendChild(tableRow);
    table.appendChild(tableHead);

    dict.forEach((value, item) => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const probabilityCell = document.createElement("td");
        nameCell.textContent = capitalize(item);
        probabilityCell.textContent = prob[value];
        row.appendChild(nameCell);
        row.appendChild(probabilityCell);
        if (capitalize(item) == class1) {
            row.classList.add("selected")
        }
        table.appendChild(row);
    })

    tables.appendChild(table);
    // document.getElementById("probability").appendChild(table);
}
