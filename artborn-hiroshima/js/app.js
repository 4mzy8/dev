const CSV_FILE = '../data/works.csv';

let works = [];


// CSV読み込み
Papa.parse(CSV_FILE, {

    download: true,

    header: true,

    skipEmptyLines: true,

    complete: function(results) {

        // 12行目から作品データ
        works = results.data.slice(10);

        // データ整理
        works = works.map(work => {

            return {
                artist: work['作家名※氏名の間は詰めて下さい。'] || '',
                title: work['作品名'] || '',
                image: work['作品画像を添付してください。\n登録するための識別用なので「ラフな画像」「低解像度の画像」で構いません、正式なものは別途運営側で撮影します。\n★作品自体がデータ（写真）で存在する場合はWEBサムネ表示用として短辺500pix以上の画像を添付してください。'] || '',
                price: work['販売税込価格\n（お客様に提示する税込価格です、運営側のマージン込みの価格を設定してください）'] || '',
                size: work['作品サイズ\n（縦x横x奥行、例：H300 x W150 x D30ｍｍ）'] || ''
            };

        });

        createArtistFilter();

        renderWorks();

    }

});


// 作家名フィルタ生成
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

        const option = document.createElement('option');

        option.value = artist;
        option.textContent = artist;

        select.appendChild(option);

    });

}


// 作品表示
function renderWorks() {

    const container = document.getElementById('works');

    const artist = document.getElementById('artist').value;

    const priceRange = document.getElementById('price').value;

    const size = document.getElementById('size').value.toLowerCase();

    const keyword = document.getElementById('keyword').value.toLowerCase();


    const filtered = works.filter(work => {

        // 作家名
        if (artist && work.artist !== artist) {
            return false;
        }


        // 金額
        if (priceRange) {

            const price = parseInt(
                work.price.replace(/[^\d]/g, ''),
                10
            ) || 0;

            const [min, max] = priceRange.split('-').map(Number);

            if (price < min || price > max) {
                return false;
            }

        }


        // サイズ
        if (
            size &&
            !work.size.toLowerCase().includes(size)
        ) {
            return false;
        }


        // キーワード
        if (keyword) {

            const text =
                `${work.artist} ${work.title}`.toLowerCase();

            if (!text.includes(keyword)) {
                return false;
            }

        }

        return true;

    });


    document.getElementById('result-count').textContent =
        filtered.length;


    container.innerHTML = '';


    filtered.forEach(work => {

        const card = document.createElement('article');

        card.className = 'work-card';


        card.innerHTML = `

            <div class="work-image">

                <img
                    src="${convertDriveUrl(work.image)}"
                    alt="${escapeHtml(work.title)}"
                    loading="lazy"
                >

            </div>

            <div class="work-info">

                <h2>${escapeHtml(work.title)}</h2>

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


// Google Drive URL → 画像URL
function convertDriveUrl(url) {

    const match = url.match(/id=([^)&]+)/);

    if (!match) {
        return '';
    }

    const fileId = match[1];

    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

}


// HTMLエスケープ
function escapeHtml(value) {

    return String(value)

        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// フィルタ変更
document
    .getElementById('artist')
    .addEventListener('change', renderWorks);

document
    .getElementById('price')
    .addEventListener('change', renderWorks);

document
    .getElementById('size')
    .addEventListener('input', renderWorks);

document
    .getElementById('keyword')
    .addEventListener('input', renderWorks);
