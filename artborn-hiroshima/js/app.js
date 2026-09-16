const CSV_FILE = './data/works.csv';

let works = [];


// ==============================
// CSV読み込み
// ==============================

fetch(CSV_FILE)

    .then(response => {

        if (!response.ok) {
            throw new Error('CSVファイルの読み込みに失敗しました');
        }

        return response.text();

    })

    .then(csv => {

        // CSVを解析
        const rows = parseCSV(csv);

        console.log('CSV行数:', rows.length);

        // 2行目から作品データ
        const dataRows = rows.slice(1);

// 16列目が「登録済」のものだけ取得
const registeredRows = dataRows
    .filter(row => row[15] === '登録済');

// 作品データ
works = registeredRows.map(row => {

    return {
        artist: row[1] || '',
        title: row[2] || '',
        image: row[3] || '',
        price: row[4] || '',
        size: row[9] || ''
    };

});


// ==============================
// 同じ作品名をまとめる
// ==============================

const mergeTitlePrefixes = [
    '一輪の花',
    '●境界線',
    '⚫️花畑',
    '⚫️N陶芸',
    '平和の像/peace statue',
    '原爆ドームの壁面',
    '個性と才能',
];


function getTitleKey(title) {

    title = title.trim();

    // 指定した文字列で始まる作品名はまとめる
    for (const prefix of mergeTitlePrefixes) {

        if (title.startsWith(prefix)) {
            return prefix;
        }

    }

    // リストにない作品は、そのまま
    return title;

}


// 作品名ごとの件数をカウント
const titleCount = {};

works.forEach(work => {

    const titleKey = getTitleKey(work.title);

    titleCount[titleKey] =
        (titleCount[titleKey] || 0) + 1;

});


// 同じ作品名は1件だけ表示
const displayedTitles = new Set();

works = works.filter(work => {

    const titleKey = getTitleKey(work.title);

    if (displayedTitles.has(titleKey)) {
        return false;
    }

    displayedTitles.add(titleKey);

    return true;

});


// 表示用の作品名を設定
works.forEach(work => {

    const titleKey = getTitleKey(work.title);

    const count = titleCount[titleKey] || 1;

    if (count > 1) {

        work.titleDisplay =
            `${titleKey}　他${count - 1}作品`;

    } else {

        work.titleDisplay =
            titleKey;

    }

});

        // 作家名・作品名が空の行を除外
        works = works.filter(work => {

            return work.artist || work.title;

        });


        console.log('作品数:', works.length);
        console.log(works);


        // 作家名フィルタ作成
        createArtistFilter();


        // 作品表示
        renderWorks();

    })

    .catch(error => {

        console.error(error);

        document.getElementById('works').innerHTML =
            '<p>作品データの読み込みに失敗しました。</p>';

    });



// ==============================
// CSV解析
// ==============================

function parseCSV(csv) {

    const rows = [];

    let row = [];
    let value = '';

    let inQuotes = false;


    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];
        const next = csv[i + 1];


        // ダブルクォート
        if (char === '"') {

            // "" → "
            if (inQuotes && next === '"') {

                value += '"';

                i++;

            } else {

                inQuotes = !inQuotes;

            }

            continue;

        }


        // カンマ
        if (char === ',' && !inQuotes) {

            row.push(value);

            value = '';

            continue;

        }


        // 改行
        if (
            (char === '\n' || char === '\r') &&
            !inQuotes
        ) {

            // CRLFの場合
            if (char === '\r' && next === '\n') {
                i++;
            }

            row.push(value);

            rows.push(row);

            row = [];

            value = '';

            continue;

        }


        value += char;

    }


    // 最後の行
    if (value !== '' || row.length > 0) {

        row.push(value);

        rows.push(row);

    }


    return rows;

}



// ==============================
// 作家名フィルタ
// ==============================

function createArtistFilter() {

    const select = document.getElementById('artist');

    const artists = [
        ...new Set(
            works
                .map(work => work.artist)
                .filter(Boolean)
        )
    ];


    artists.sort();


    artists.forEach(artist => {

        const option =
            document.createElement('option');

        option.value = artist;

        option.textContent = artist;

        select.appendChild(option);

    });

}



// ==============================
// 作品表示
// ==============================

function renderWorks() {

    const container =
        document.getElementById('works');


    const artist =
        document.getElementById('artist').value;


    const priceRange =
        document.getElementById('price').value;


    const size =
        document.getElementById('size').value
            .toLowerCase();


    const keyword =
        document.getElementById('keyword').value
            .toLowerCase();


    const filtered =
        works.filter(work => {


            // 作家名
            if (
                artist &&
                work.artist !== artist
            ) {

                return false;

            }


            // 金額
            if (priceRange) {

                const price =
                    parseInt(
                        work.price.replace(/[^\d]/g, ''),
                        10
                    ) || 0;


                const [min, max] =
                    priceRange.split('-')
                        .map(Number);


                if (
                    price < min ||
                    price > max
                ) {

                    return false;

                }

            }


            // サイズ
            if (
                size &&
                !work.size
                    .toLowerCase()
                    .includes(size)
            ) {

                return false;

            }


            // キーワード
            if (keyword) {

                const text =
                    `${work.artist} ${work.title}`
                        .toLowerCase();


                if (!text.includes(keyword)) {

                    return false;

                }

            }


            return true;

        });


    // 件数
    document.getElementById(
        'result-count'
    ).textContent = filtered.length;


    // 初期化
    container.innerHTML = '';


    // 作品カード
    filtered.forEach(work => {

        const card =
            document.createElement('article');


        card.className = 'work-card';


        const imageUrl =
            convertDriveUrl(work.image);


        card.innerHTML = `

            <div class="work-image">

                ${
                    imageUrl
                    ?
                    `<img
                        src="${imageUrl}"
                        alt="${escapeHtml(work.title)}"
                        loading="lazy"
                    >`
                    :
                    `<div class="no-image">
                        画像なし
                    </div>`
                }

            </div>


            <div class="work-info">

                <h2>
                    ${escapeHtml(work.titleDisplay)}
                </h2>


                <p class="artist">
                    ${escapeHtml(work.artist)}
                </p>


                <p class="price">
                    ${escapeHtml(work.price)}
                </p>


                <p class="size">
                    ${escapeHtml(work.size)}
                </p>

            </div>

        `;


        container.appendChild(card);

    });

}



// ==============================
// Google Drive画像URL変換
// ==============================

function convertDriveUrl(url) {

    if (!url) {
        return '';
    }


    // Markdown形式
    // [表示URL](実URL)
    const markdownMatch =
        url.match(/\]\((.*?)\)/);


    if (markdownMatch) {

        url = markdownMatch[1];

    }


    // Google DriveのID
    const idMatch =
        url.match(/[?&]id=([^&]+)/);


    if (!idMatch) {

        return '';

    }


    const fileId =
        idMatch[1];


    return (
        'https://drive.google.com/thumbnail' +
        '?id=' + encodeURIComponent(fileId) +
        '&sz=w50'
    );

}



// ==============================
// HTMLエスケープ
// ==============================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}



// ==============================
// フィルタイベント
// ==============================

document
    .getElementById('artist')
    .addEventListener(
        'change',
        renderWorks
    );


document
    .getElementById('price')
    .addEventListener(
        'change',
        renderWorks
    );


document
    .getElementById('size')
    .addEventListener(
        'input',
        renderWorks
    );


document
    .getElementById('keyword')
    .addEventListener(
        'input',
        renderWorks
    );
