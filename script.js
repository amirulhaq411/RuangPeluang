document.addEventListener("DOMContentLoaded", () => {
    // === Logika Universal Navigasi SPA via atribut [data-target] ===
    const screens = document.querySelectorAll('.screen');
    const navBtns = document.querySelectorAll('.nav-btn');

    function goToScreen(targetId) {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.scrollTop = 0;
            
            if (targetId === 'screen-quiz') {
            setTimeout(loadQuizQuestion, 50); // Beri jeda sepersekian detik agar DOM siap
            }
        }

        // Sinkronisasi tombol Navbar atas
        navBtns.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // ==========================================
        // [MATHJAX] RENDER ULANG SAAT PINDAH HALAMAN
        // ==========================================
        // Sistem SPA hanya menyembunyikan div, MathJax mungkin tidak mendeteksi teks baru.
        // typesetPromise() memaksa MathJax memindai ulang seluruh dokumen untuk mencari elemen matematika baru.
        if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
            MathJax.typesetPromise().catch((err) => console.log(err));
        }
    }

    // Tangkap semua elemen yang memiliki atribut data-target (termasuk kartu modul & tombol)
    document.body.addEventListener('click', (e) => {
        const targetEl = e.target.closest('[data-target]');
        if (targetEl) {
            const targetId = targetEl.getAttribute('data-target');
            goToScreen(targetId);
        }
    });

    // === FITUR BARU: Sistem Identitas Siswa (Local Storage) ===
    const btnMulaiBelajar = document.getElementById('btn-mulai-belajar');
    const inputNama = document.getElementById('input-nama-siswa');
    const errorNama = document.getElementById('error-nama');
    const sapaanSiswa = document.getElementById('sapaan-siswa');

    // Cek apakah nama sudah pernah disimpan sebelumnya saat web dibuka
    if (localStorage.getItem('namaSiswaRuangPeluang')) {
        let namaTersimpan = localStorage.getItem('namaSiswaRuangPeluang');
        if (inputNama) inputNama.value = namaTersimpan;
        if (sapaanSiswa) sapaanSiswa.innerText = `Halo, ${namaTersimpan}! Siap bereksplorasi?`;
    }

    if (btnMulaiBelajar) {
        btnMulaiBelajar.addEventListener('click', () => {
            let nama = inputNama.value.trim();
            if (nama === "") {
                // Jika kosong, getarkan kotak input dan munculkan error
                inputNama.classList.add('shake-error');
                errorNama.style.display = 'block';
                setTimeout(() => inputNama.classList.remove('shake-error'), 500);
            } else {
                // Jika diisi, simpan ke memori browser dan pindah layar
                localStorage.setItem('namaSiswaRuangPeluang', nama);
                errorNama.style.display = 'none';
                if (sapaanSiswa) sapaanSiswa.innerText = `Halo, ${nama}! Siap bereksplorasi?`;
                goToScreen('screen-modules');
            }
        });
    }


    // === Logika Drag and Drop (Screen 2: Ruang Sampel) ===
    const draggables = document.querySelectorAll('.draggable');
    const dropZone = document.getElementById('drop-zone');
    const conclusionBox = document.getElementById('conclusion-box');
    const placeholderText = document.querySelector('.placeholder-text');
    let droppedCount = 0;

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    if(dropZone) {
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('hovered');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('hovered');
        });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('hovered');
            
            const draggable = document.querySelector('.dragging');
            if (draggable && draggable.parentElement !== dropZone) {
                dropZone.appendChild(draggable);
                droppedCount++;
                if(placeholderText) placeholderText.style.display = 'none';

                if(droppedCount === 6) {
                    conclusionBox.style.display = 'block';
                    // [MATHJAX] Meminta MathJax hanya merender ulang isi conclusionBox saja agar performa browser tetap cepat
                    if (window.MathJax) {
                        MathJax.typesetPromise([conclusionBox]);
                    }
                }
            }
        });
    }

    // === Logika Lab Simulasi (Screen 3) ===
    let totalA = 0;
    let totalG = 0;
    let totalN = 0;

    window.simulasiLempar = function(times) {
        const coin = document.getElementById('the-coin');
        if(!coin) return;
        coin.classList.remove('flip-animation');
        void coin.offsetWidth; 
        coin.classList.add('flip-animation');

        let a = 0;
        let g = 0;
        for(let i = 0; i < times; i++) {
            if(Math.random() < 0.5) a++;
            else g++;
        }

        setTimeout(() => {
            if (times === 1) {
                coin.style.transform = (a === 1) ? "rotateY(0deg)" : "rotateY(180deg)";
            } else {
                coin.style.transform = "rotateY(0deg)";
            }
        }, 600);

        totalA += a;
        totalG += g;
        totalN += times;
        updateDashboard();
    }

    window.resetSimulasi = function() {
        totalA = 0;
        totalG = 0;
        totalN = 0;
        const coin = document.getElementById('the-coin');
        if(coin) coin.style.transform = "rotateY(0deg)";
        const conc = document.getElementById('simulasi-conclusion');
        if(conc) conc.style.display = 'none';
        updateDashboard();
    }

    function updateDashboard() {
        const cA = document.getElementById('count-A');
        const cG = document.getElementById('count-G');
        const tN = document.getElementById('total-N');
        if(!cA) return;

        cA.innerText = totalA;
        cG.innerText = totalG;
        tN.innerText = totalN;

        let freqA = totalN === 0 ? 0 : (totalA / totalN).toFixed(2);
        let freqG = totalN === 0 ? 0 : (totalG / totalN).toFixed(2);

        // ==========================================
        // [MATHJAX] UPDATE RUMUS PECAHAN DINAMIS
        // ==========================================
        // Memasukkan hasil hitungan JavaScript ke dalam format LaTeX (\frac) sebagai teks biasa dulu.
        document.getElementById('freq-A').innerText = `\\(\\frac{${totalA}}{${totalN}} = ${freqA}\\)`;
        document.getElementById('freq-G').innerText = `\\(\\frac{${totalG}}{${totalN}} = ${freqG}\\)`;

        // Lalu panggil MathJax agar mengubah teks tersebut menjadi rumus visual secara instan.
        if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
            MathJax.typesetPromise([document.getElementById('freq-A'), document.getElementById('freq-G')]);
        }

        let pctA = totalN === 0 ? 0 : (totalA / totalN) * 100;
        let pctG = totalN === 0 ? 0 : (totalG / totalN) * 100;
        
        document.getElementById('bar-A').style.height = pctA + '%';
        document.getElementById('bar-G').style.height = pctG + '%';

        if (totalN >= 100) {
            const conclusion = document.getElementById('simulasi-conclusion');
            if (conclusion && conclusion.style.display === 'none') {
                conclusion.style.display = 'block';
                if (window.MathJax) MathJax.typesetPromise([conclusion]);
            }
        }
    }

    // === Logika Screen 4 (Peluang Teoretik Interaktif) ===
    let correctBlue = 0;
    let correctTotal = 0;
    let foundBlue = 0; // BAGIAN BARU: Melacak bola biru yang sudah diklik

    function generateBalls() {
        const container = document.getElementById('ball-container');
        if(!container) return;
        container.innerHTML = ''; // Kosongkan stoples
        
        // Reset seluruh data input setiap kali bola diacak
        foundBlue = 0;
        const inputA = document.getElementById('input-nA');
        const inputS = document.getElementById('input-nS');
        const feedback = document.getElementById('teori-feedback');
        if (inputA) inputA.value = '';
        if (inputS) inputS.value = '';
        if (feedback) feedback.style.display = 'none';
        if (inputA) inputA.classList.remove('shake-error');
        if (inputS) inputS.classList.remove('shake-error');
        
        correctTotal = Math.floor(Math.random() * 5) + 5;
        correctBlue = Math.floor(Math.random() * (correctTotal - 1)) + 1;
        let redBalls = correctTotal - correctBlue;

        let colors = [];
        for(let i=0; i<correctBlue; i++) colors.push('#3498DB'); // Biru
        for(let i=0; i<redBalls; i++) colors.push('#E74C3C'); // Merah
        colors.sort(() => Math.random() - 0.5); 

        let ballIndex = 0;
        for(let row = 0; row < 3; row++) {
            for(let col = 0; col < 3; col++) {
                if(ballIndex < correctTotal) {
                    let cx = 65 + (col * 35) + (Math.random() * 10 - 5);
                    let cy = 215 - (row * 35) + (Math.random() * 8 - 4);
                    
                    // ==========================================
                    // [SVG] GENERASI BOLA SVG INTERAKTIF
                    // ==========================================
                    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circle.setAttribute("cx", cx);
                    circle.setAttribute("cy", cy);
                    circle.setAttribute("r", 17);
                    circle.setAttribute("fill", colors[ballIndex]);
                    
                    // MENAMBAHKAN ATRIBUT INTERAKTIF (Untuk fitur klik)
                    circle.setAttribute("class", "interactive-ball");
                    circle.setAttribute("data-color", colors[ballIndex]); 
                    
                    // Event Listener saat bola SVG diklik langsung di dalam stoples
                    circle.addEventListener('click', function() {
                        if (this.getAttribute('data-color') === '#3498DB') {
                            // Jika Biru dan belum pernah diklik
                            if (!this.classList.contains('ball-selected')) {
                                this.classList.add('ball-selected');
                                foundBlue++;
                                
                                // Auto-fill nilai n(A) ke kolom input
                                if(inputA) {
                                    inputA.value = foundBlue;
                                    inputA.classList.remove('input-pop');
                                    void inputA.offsetWidth; // Memicu reflow animasi CSS pop
                                    inputA.classList.add('input-pop');
                                }
                            }
                        } else {
                            // Jika Merah diklik (Berikan efek error bergetar)
                            this.classList.remove('ball-error');
                            void this.offsetWidth; 
                            this.classList.add('ball-error');
                        }
                    });

                    let highlight = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    highlight.setAttribute("cx", cx - 5);
                    highlight.setAttribute("cy", cy - 5);
                    highlight.setAttribute("r", 5);
                    highlight.setAttribute("fill", "rgba(255,255,255,0.4)");
                    highlight.style.pointerEvents = "none"; // Agar efek klik tembus ke objek utama di bawahnya
                    
                    container.appendChild(circle);
                    container.appendChild(highlight);
                    ballIndex++;
                }
            }
        }
    }

    generateBalls();

    // Event Listener untuk Tombol Acak Ulang Stoples
    const btnAcakBola = document.getElementById('btn-acak-bola');
    if (btnAcakBola) {
        btnAcakBola.addEventListener('click', () => {
            generateBalls(); // Panggil ulang fungsi pembuat bola SVG
        });
    }

    const btnCekTeori = document.getElementById('btn-cek-teori');
    if(btnCekTeori) {
        btnCekTeori.addEventListener('click', () => {
            const inputA = document.getElementById('input-nA');
            const inputS = document.getElementById('input-nS');
            const feedback = document.getElementById('teori-feedback');
            const solution = document.getElementById('teori-solution');
            
            let valA = parseInt(inputA.value);
            let valS = parseInt(inputS.value);
            
            inputA.classList.remove('shake-error');
            inputS.classList.remove('shake-error');
            
            if (valA === correctBlue && valS === correctTotal) {
                feedback.style.display = 'block';
                // [MATHJAX] Menyisipkan jawaban benar dengan sintaks pecahan blok $$
                solution.innerHTML = `$$P(\\text{Biru}) = \\frac{${correctBlue}}{${correctTotal}}$$`;
                if(window.MathJax && typeof MathJax.typesetPromise === 'function') MathJax.typesetPromise([solution]);
            } else {
                feedback.style.display = 'none';
                if (valA !== correctBlue) inputA.classList.add('shake-error');
                if (valS !== correctTotal) inputS.classList.add('shake-error');
            }
        });
    }

    // === Logika Modul 3 (Peluang Komplemen) ===
    const slider = document.getElementById('komplemen-slider');
    const sliderVal = document.getElementById('slider-val');
    const barA = document.getElementById('bar-A');
    const barAc = document.getElementById('bar-Ac');
    const formulaDisplay = document.getElementById('formula-display');

    if(slider) {
        slider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            let pA = val / 100;
            let pAc = (100 - val) / 100;

            sliderVal.innerText = pA.toFixed(2);
            barA.style.width = val + '%';
            barAc.style.width = (100 - val) + '%';
            
            barA.innerText = val > 15 ? `P(A) = ${pA.toFixed(2)}` : "";
            barAc.innerText = (100 - val) > 15 ? `P(A') = ${pAc.toFixed(2)}` : "";

            if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                MathJax.typesetPromise([formulaDisplay]);
            }
        });
    }

    // === LOGIKA MODUL 4 (Ruang Sampel Dua Dadu & Misi Tantangan) ===
    const matrixTable = document.getElementById('dadu-matrix');
    let markedCount = 0;

    if (matrixTable) {
        let html = '<tr><th>/</th>';
        for(let j=1; j<=6; j++) html += `<th>${j}</th>`;
        html += '</tr>';

        for(let i=1; i<=6; i++) {
            html += `<tr><th>${i}</th>`;
            for(let j=1; j<=6; j++) {
                html += `<td class="matrix-cell" id="cell-${i}-${j}">(${i},${j})</td>`;
            }
            html += '</tr>';
        }
        matrixTable.innerHTML = html;
    }

    const btnLemparDadu = document.getElementById('btn-lempar-dadu');
    const pblBox = document.getElementById('pbl-challenge-box');

    if (btnLemparDadu) {
        btnLemparDadu.addEventListener('click', () => {
            let d1 = Math.floor(Math.random() * 6) + 1;
            let d2 = Math.floor(Math.random() * 6) + 1;

            const box1 = document.getElementById('dadu-1-box');
            const box2 = document.getElementById('dadu-2-box');
            if(box1) box1.innerText = d1;
            if(box2) box2.innerText = d2;

            let cellId = `cell-${d1}-${d2}`;
            let cell = document.getElementById(cellId);
            
            if(cell && !cell.classList.contains('marked')) {
                cell.classList.add('marked');
                markedCount++;
                const counter = document.getElementById('matrix-counter');
                if(counter) counter.innerText = `Titik sampel ditemukan: ${markedCount} dari 36`;

                if (markedCount === 36 && pblBox) {
                    pblBox.style.display = 'block';
                }
            }
        });
    }

    const btnResetDadu = document.getElementById('btn-reset-dadu');
    if (btnResetDadu) {
        btnResetDadu.addEventListener('click', () => {
            markedCount = 0;
            const box1 = document.getElementById('dadu-1-box');
            const box2 = document.getElementById('dadu-2-box');
            if(box1) box1.innerText = '🎲';
            if(box2) box2.innerText = '🎲';
            
            const counter = document.getElementById('matrix-counter');
            if(counter) counter.innerText = `Titik sampel ditemukan: 0 dari 36`;
            
            if(pblBox) pblBox.style.display = 'none';
            const feedback = document.getElementById('tantangan-feedback');
            if(feedback) feedback.innerText = '';
            const inputTantangan = document.getElementById('input-tantangan');
            if(inputTantangan) inputTantangan.value = '';
            
            const cells = document.querySelectorAll('.matrix-cell');
            cells.forEach(c => c.classList.remove('marked'));
        });
    }

    const btnCekTantangan = document.getElementById('btn-cek-tantangan');
    if (btnCekTantangan) {
        btnCekTantangan.addEventListener('click', () => {
            const inputVal = parseInt(document.getElementById('input-tantangan').value);
            const feedback = document.getElementById('tantangan-feedback');
            
            if(feedback) {
                feedback.style.marginTop = "12px";
                feedback.style.fontSize = "0.95rem";
                
                if (inputVal === 6) {
                    feedback.style.color = "#27AE60";
                    // ==========================================
                    // [MATHJAX] MENYISIPKAN JAWABAN PECAHAN DAN HIMPUNAN
                    // ==========================================
                    feedback.innerHTML = "🎉 Benar sekali! Ada 6 titik sampel yang jumlahnya 7: \\((1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\\).<br>Maka peluangnya adalah $$P(\\text{Jumlah 7}) = \\frac{6}{36} = \\frac{1}{6}$$";
                    
                    if(window.MathJax && typeof MathJax.typesetPromise === 'function') MathJax.typesetPromise([feedback]);
                } else {
                    feedback.style.color = "#C0392B";
                    feedback.innerHTML = "❌ Kurang tepat. Coba hitung lagi diagonal titik sampel yang menghasilkan jumlah 7 pada tabel matriks di atas!";
                }
            }
        });
    }

    // === LOGIKA MODUL 5 (Frekuensi Harapan) ===
    const sliderPercobaan = document.getElementById('fh-percobaan');
    const valPercobaan = document.getElementById('val-percobaan');
    const btnHitungFh = document.getElementById('btn-hitung-fh');
    const fhOutputText = document.getElementById('fh-output-text');
    const fhFormulaDisplay = document.getElementById('fh-formula-display');

    if (sliderPercobaan && valPercobaan) {
        sliderPercobaan.addEventListener('input', (e) => {
            valPercobaan.innerText = e.target.value;
        });
    }

    if (btnHitungFh) {
        btnHitungFh.addEventListener('click', () => {
            let n = parseInt(sliderPercobaan.value);
            let fh = (1 / 6) * n;

            if (fhOutputText) {
                // ==========================================
                // [MATHJAX] MENEBALKAN ANGKA HASIL (mathbf)
                // ==========================================
                // \mathbf{} digunakan untuk menebalkan (bold) hasil hitungan JS di dalam renderan MathJax
                fhOutputText.innerHTML = `$$F_h = \\frac{1}{6} \\times ${n} = \\mathbf{${Math.round(fh)}}\\text{ kali}$$`;
                
                if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                    MathJax.typesetPromise([fhOutputText]);
                }
            }
        });
    }

    if (window.MathJax && typeof MathJax.typesetPromise === 'function' && fhFormulaDisplay) {
        MathJax.typesetPromise([fhFormulaDisplay]);
    }

    // === LOGIKA KUIS INTERAKTIF ===
    const quizData = [
        // --- MODUL 1: Ruang Sampel & Titik Sampel ---
        {
            question: "Himpunan semua hasil yang mungkin terjadi dari suatu percobaan disebut...",
            options: ["Titik Sampel", "Ruang Sampel", "Kejadian", "Peluang"],
            correct: 1,
            explanation: "Ruang sampel adalah himpunan semua hasil yang mungkin (semesta), sedangkan titik sampel adalah anggota dari ruang sampel."
        },
        {
            question: "Berapa banyak titik sampel dari pelemparan sebuah uang logam dan sebuah dadu secara bersamaan?",
            options: ["8", "10", "12", "16"],
            correct: 2,
            explanation: "Koin memiliki 2 titik sampel (A, G) dan dadu memiliki 6. Total ruang sampel = 2 x 6 = 12."
        },
        {
            question: "Jika tiga keping uang logam dilempar bersama-sama, banyaknya anggota ruang sampel adalah...",
            options: ["6", "8", "9", "12"],
            correct: 1,
            explanation: "Rumus ruang sampel koin adalah 2^n. Untuk 3 koin, maka 2^3 = 2 x 2 x 2 = 8 titik sampel."
        },
        {
            question: "Terdapat sebuah kantong berisi huruf penyusun kata 'PELUANG'. Jika diambil 1 huruf secara acak, manakah yang merupakan titik sampel huruf vokal?",
            options: ["{P, L, N, G}", "{E, U, A}", "{P, E, L, U}", "{A, N, G}"],
            correct: 1,
            explanation: "Huruf vokal (A, I, U, E, O) pada kata P-E-L-U-A-N-G adalah E, U, dan A."
        },

        // --- MODUL 2: Peluang Empirik & Teoretik ---
        {
            question: "Peluang empirik didapatkan berdasarkan...",
            options: ["Rumus matematika", "Tebakan", "Hasil percobaan nyata", "Luas ruang sampel"],
            correct: 2,
            explanation: "Peluang empirik (frekuensi relatif) didapatkan dari perbandingan antara banyak kejadian yang muncul dengan total percobaan nyata yang dilakukan."
        },
        {
            question: "Sebuah dadu dilempar sekali. Berapa peluang teoretik munculnya mata dadu prima?",
            options: ["1/6", "1/3", "1/2", "2/3"],
            correct: 2,
            explanation: "Mata dadu prima adalah 2, 3, 5 (ada 3). Maka peluangnya P = 3/6 = 1/2."
        },
        {
            question: "Tono melempar koin 50 kali. Ternyata sisi Angka muncul 20 kali. Berapa peluang empirik munculnya sisi Gambar?",
            options: ["20/50", "30/50", "10/50", "40/50"],
            correct: 1,
            explanation: "Jika angka muncul 20 kali, maka gambar muncul 50 - 20 = 30 kali. Peluang empirik gambar = 30/50."
        },
        {
            question: "Dalam stoples terdapat 4 bola merah, 5 bola biru, dan 3 bola kuning. Peluang terambilnya bola biru adalah...",
            options: ["5/12", "4/12", "3/12", "5/8"],
            correct: 0,
            explanation: "Total seluruh bola n(S) = 4 + 5 + 3 = 12. Bola biru n(Biru) = 5. Peluangnya = 5/12."
        },

        // --- MODUL 3: Peluang Komplemen ---
        {
            question: "Jika nilai peluang suatu kejadian adalah P(A), maka peluang kejadian tersebut TIDAK terjadi (komplemennya) adalah...",
            options: ["P(A) + 1", "P(A) - 1", "1 - P(A)", "P(A) * 0"],
            correct: 2,
            explanation: "Jumlah peluang kejadian dan komplemennya selalu 1. Maka P(A') = 1 - P(A)."
        },
        {
            question: "Peluang Budi lulus ujian adalah 0,85. Berapa peluang Budi tidak lulus ujian?",
            options: ["0,05", "0,15", "0,25", "1,85"],
            correct: 1,
            explanation: "Peluang tidak lulus = 1 - Peluang lulus = 1 - 0,85 = 0,15."
        },
        {
            question: "Sebuah dadu dilempar sekali. Berapakah peluang muncul mata dadu yang BUKAN angka 6?",
            options: ["1/6", "4/6", "5/6", "1"],
            correct: 2,
            explanation: "Peluang muncul angka 6 adalah 1/6. Maka peluang komplemennya (BUKAN 6) adalah 1 - (1/6) = 5/6."
        },
        {
            question: "Peluang besok turun hujan adalah 30%. Persentase peluang besok cuaca cerah (tidak hujan) adalah...",
            options: ["30%", "50%", "70%", "100%"],
            correct: 2,
            explanation: "Peluang komplemen dalam persentase = 100% - 30% = 70%."
        },

        // --- MODUL 4: Ruang Sampel Dua Objek ---
        {
            question: "Dua buah dadu dilemparkan secara bersamaan. Total seluruh kemungkinan hasil n(S) adalah...",
            options: ["12", "24", "36", "48"],
            correct: 2,
            explanation: "Satu dadu memiliki 6 sisi. Jika ada 2 dadu, ruang sampelnya adalah 6 x 6 = 36 titik sampel."
        },
        {
            question: "Dari pelemparan dua buah dadu, berapakah peluang munculnya mata dadu kembar (sama)?",
            options: ["1/36", "1/12", "1/6", "1/4"],
            correct: 2,
            explanation: "Mata dadu kembar ada 6 pasang: (1,1), (2,2), (3,3), (4,4), (5,5), (6,6). Peluangnya = 6/36 = 1/6."
        },
        {
            question: "Peluang munculnya jumlah kedua mata dadu sama dengan 10 adalah...",
            options: ["2/36", "3/36", "4/36", "5/36"],
            correct: 1,
            explanation: "Pasangan yang berjumlah 10 adalah: (4,6), (5,5), dan (6,4). Ada 3 titik sampel, peluangnya = 3/36."
        },
        {
            question: "Dua mata uang logam dilempar bersama-sama. Peluang muncul minimal 1 sisi Angka adalah...",
            options: ["1/4", "2/4", "3/4", "4/4"],
            correct: 2,
            explanation: "Titik sampel 2 koin: (A,A), (A,G), (G,A), (G,G). Yang memuat minimal 1 Angka ada 3, peluangnya = 3/4."
        },

        // --- MODUL 5: Frekuensi Harapan ---
        {
            question: "Frekuensi harapan diperoleh dengan cara mengalikan...",
            options: ["Peluang dengan titik sampel", "Peluang dengan banyak percobaan", "Ruang sampel dengan banyak percobaan", "Kejadian A dengan Kejadian B"],
            correct: 1,
            explanation: "Rumus Frekuensi Harapan Fh(A) = P(A) x n (banyaknya percobaan yang dilakukan)."
        },
        {
            question: "Sebuah koin dilempar sebanyak 200 kali. Berapa kali frekuensi harapan munculnya sisi Gambar?",
            options: ["50 kali", "100 kali", "150 kali", "200 kali"],
            correct: 1,
            explanation: "Peluang sisi Gambar pada koin = 1/2. FH = 1/2 x 200 = 100 kali."
        },
        {
            question: "Sebuah dadu dilempar sebanyak 120 kali. Frekuensi harapan munculnya mata dadu ganjil adalah...",
            options: ["20 kali", "40 kali", "60 kali", "80 kali"],
            correct: 2,
            explanation: "Peluang mata dadu ganjil (1,3,5) adalah 3/6 atau 1/2. FH = 1/2 x 120 = 60 kali."
        },
        {
            question: "Peluang suatu mesin pembuat roti menghasilkan roti yang bantat/cacat adalah 0,02. Jika mesin memproduksi 1.000 roti, berapa perkiraan roti yang cacat?",
            options: ["2 buah", "20 buah", "200 buah", "980 buah"],
            correct: 1,
            explanation: "FH roti cacat = P(Cacat) x Banyak Produksi = 0,02 x 1000 = 20 buah."
        }
    ];

    let currentQuizIndex = 0;
    let quizScore = 0;

    var quizQuestionEl = document.getElementById('quiz-question');
    var quizOptionsEl = document.getElementById('quiz-options');
    var quizProgressEl = document.getElementById('quiz-progress');
    var quizScoreBadge = document.getElementById('quiz-score-badge');
    var quizFeedbackEl = document.getElementById('quiz-feedback');
    var btnNextQuiz = document.getElementById('btn-next-quiz');
    var quizContainer = document.getElementById('quiz-container');
    var quizResultScreen = document.getElementById('quiz-result-screen');
    var finalScoreText = document.getElementById('final-score-text');
    var btnRestartQuiz = document.getElementById('btn-restart-quiz');

    function loadQuizQuestion() {
        if (quizQuestionEl && currentQuizIndex < quizData.length) {
            let currentQ = quizData[currentQuizIndex];
            if(quizProgressEl) quizProgressEl.innerText = `Soal ${currentQuizIndex + 1} dari ${quizData.length}`;
            if(quizQuestionEl) quizQuestionEl.innerText = currentQ.question;
            if(quizFeedbackEl) quizFeedbackEl.innerText = "";
            if(btnNextQuiz) btnNextQuiz.style.display = "none";
            
            if(quizOptionsEl) {
                quizOptionsEl.innerHTML = "";
                currentQ.options.forEach((opt, idx) => {
                    let btn = document.createElement('button');
                    btn.style.cssText = "padding: 12px 15px; text-align: left; background: #F8FBFE; border: 2px solid #DCE4EC; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: all 0.2s;";
                    btn.innerText = opt;
                    btn.addEventListener('click', () => selectQuizAnswer(idx, btn));
                    quizOptionsEl.appendChild(btn);
                });
            }
        } else if (quizContainer && quizResultScreen) {
            quizContainer.style.display = "none";
            quizResultScreen.style.display = "block";
            if(finalScoreText) finalScoreText.innerText = `${quizScore} / ${quizData.length * 25}`;
            
            // FITUR BARU: Mengambil nama dari Local Storage untuk ditaruh di sertifikat
            const namaSertifikat = document.getElementById('nama-sertifikat');
            let namaTersimpan = localStorage.getItem('namaSiswaRuangPeluang') || "Pelajar Hebat";
            if (namaSertifikat) namaSertifikat.innerText = namaTersimpan;
        }
    }

    function selectQuizAnswer(selectedIndex, selectedBtn) {
        let currentQ = quizData[currentQuizIndex];
        const allOptionBtns = quizOptionsEl.querySelectorAll('button');
        
        allOptionBtns.forEach(b => b.style.pointerEvents = "none");

        if (selectedIndex === currentQ.correct) {
            selectedBtn.style.background = "#E8F8F5";
            selectedBtn.style.borderColor = "#27AE60";
            selectedBtn.style.color = "#27AE60";
            selectedBtn.style.fontWeight = "bold";
            if(quizFeedbackEl) {
                quizFeedbackEl.style.color = "#27AE60";
                quizFeedbackEl.innerHTML = `🎉 Benar! ${currentQ.explanation}`;
            }
            // Ubah penambahan skor menjadi 5 poin per soal
            quizScore += 5;
            if(quizScoreBadge) quizScoreBadge.innerText = `Skor: ${quizScore}`;
        } else {
            selectedBtn.style.background = "#FDEDEC";
            selectedBtn.style.borderColor = "#C0392B";
            selectedBtn.style.color = "#C0392B";
            selectedBtn.style.fontWeight = "bold";
            allOptionBtns[currentQ.correct].style.background = "#E8F8F5";
            allOptionBtns[currentQ.correct].style.borderColor = "#27AE60";
            
            if(quizFeedbackEl) {
                quizFeedbackEl.style.color = "#C0392B";
                quizFeedbackEl.innerHTML = `❌ Kurang tepat. ${currentQ.explanation}`;
            }
        }

        if(btnNextQuiz) btnNextQuiz.style.display = "block";
    }

    if (btnNextQuiz) {
        btnNextQuiz.addEventListener('click', () => {
            currentQuizIndex++;
            loadQuizQuestion();
        });
    }

    if (btnRestartQuiz) {
        btnRestartQuiz.addEventListener('click', () => {
            currentQuizIndex = 0;
            quizScore = 0;
            if(quizScoreBadge) quizScoreBadge.innerText = `Skor: 0`;
            if(quizContainer) quizContainer.style.display = "block";
            if(quizResultScreen) quizResultScreen.style.display = "none";
            loadQuizQuestion();
        });
    }
    if (typeof loadQuizQuestion === 'function') {
        loadQuizQuestion();
    }

    // FITUR BARU: Tombol Cetak PDF
    const btnCetakHasil = document.getElementById('btn-cetak-hasil');
    if (btnCetakHasil) {
        btnCetakHasil.addEventListener('click', () => {
            window.print(); // Memanggil fungsi cetak bawaan browser
        });
    }

});