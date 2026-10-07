const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, getDoc, updateDoc, increment, getDocs, orderBy, query } = require('firebase/firestore');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ADMIN_PASS = "arafat01721313101";

// ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyBhhAwzd2PVj9mSiPGiMUzviky1z5d0L_s",
  authDomain: "social-media-marketing-a3fe2.firebaseapp.com",
  projectId: "social-media-marketing-a3fe2",
  storageBucket: "social-media-marketing-a3fe2.firebasestorage.app",
  messagingSenderId: "150991715313",
  appId: "1:150991715313:web:7f990a3d5b690c4a276250",
  measurementId: "G-VDYTB5N480"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ১. এডমিন প্যানেল পেজ (/admin) - পাসওয়ার্ড সিকিউরিটি সহ
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart Link Admin Panel</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f7f6; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h2 { margin-top: 0; color: #007bff; text-align: center; }
        .form-group { margin-bottom: 15px; }
        label { font-weight: bold; display: block; margin-bottom: 5px; }
        input[type="url"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
        button { background: #007bff; color: white; border: none; padding: 12px 20px; font-size: 16px; border-radius: 5px; cursor: pointer; width: 100%; }
        button:hover { background: #0056b3; }
        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; word-break: break-all; }
        th { background-color: #007bff; color: white; }
        .copy-btn { background: #28a745; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
        .copy-btn:hover { background: #218838; }
        .login-box { max-width: 400px; margin: 80px auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>

      <!-- লগইন সেকশন -->
      <div id="loginSection" class="login-box">
        <h2 style="margin-bottom: 20px;">এডমিন লগইন</h2>
        <div class="form-group">
          <label>পাসওয়ার্ড দিন:</label>
          <input type="password" id="passInput" placeholder="Enter Admin Password">
        </div>
        <button onclick="checkPass()">লগইন করুন</button>
        <p id="errorMsg" style="color: red; display: none; margin-top: 10px; text-align: center;">ভুল পাসওয়ার্ড!</p>
      </div>

      <!-- মূল এডমিন প্যানেল -->
      <div id="adminSection" class="container" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin:0;">স্মার্টলিংক এডমিন প্যানেল</h2>
          <button onclick="logout()" style="width: auto; background: #dc3545; padding: 6px 15px;">লগআউট</button>
        </div>
        <form id="linkForm">
          <div class="form-group">
            <label>১. অনলাইন ইমেজ লিংক (Image URL):</label>
            <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg" required>
          </div>
          <div class="form-group">
            <label>২. অ্যাডস / স্মার্টলিংক (Ad URL):</label>
            <input type="url" id="adUrl" placeholder="https://example.com/ad-link" required>
          </div>
          <button type="submit" id="btnText">RUN (লিংক জেনারেট করুন)</button>
        </form>

        <h3>তৈরি করা লিংকের তালিকা</h3>
        <table>
          <thead>
            <tr>
              <th>ইমেজ প্রিভিউ</th>
              <th>জেনারেটেড শর্ট লিংক</th>
              <th>মোট ক্লিক</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody id="linkList">
            <tr><td colspan="4" style="text-align:center;">লিংক লোড হচ্ছে...</td></tr>
          </tbody>
        </table>
      </div>

      <script>
        const AUTH_KEY = "${ADMIN_PASS}";

        function checkPass() {
          const pass = document.getElementById('passInput').value;
          if (pass === AUTH_KEY) {
            localStorage.setItem('admin_token', pass);
            showAdmin();
          } else {
            document.getElementById('errorMsg').style.display = 'block';
          }
        }

        function logout() {
          localStorage.removeItem('admin_token');
          location.reload();
        }

        function showAdmin() {
          document.getElementById('loginSection').style.display = 'none';
          document.getElementById('adminSection').style.display = 'block';
          loadLinks();
        }

        if (localStorage.getItem('admin_token') === AUTH_KEY) {
          showAdmin();
        }

        async function loadLinks() {
          const res = await fetch('/api/links');
          const data = await res.json();
          const tbody = document.getElementById('linkList');
          tbody.innerHTML = '';
          
          if(!data.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">এখনো কোনো লিংক তৈরি করা হয়নি।</td></tr>';
            return;
          }

          data.forEach(item => {
            const shortUrl = window.location.origin + '/p/' + item.id;
            tbody.innerHTML += \`
              <tr>
                <td><img src="\${item.imageUrl}" width="60" height="60" style="object-fit:cover; border-radius:5px;"></td>
                <td><a href="\${shortUrl}" target="_blank">\${shortUrl}</a></td>
                <td style="font-weight:bold; color:#007bff; text-align:center;">\${item.clicks || 0}</td>
                <td><button class="copy-btn" onclick="navigator.clipboard.writeText('\${shortUrl}'); alert('লিংক কপি হয়েছে!');">Copy</button></td>
              </tr>
            \`;
          });
        }

        document.getElementById('linkForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('btnText');
          btn.innerText = 'জেনারেট হচ্ছে...';
          btn.disabled = true;

          const imageUrl = document.getElementById('imageUrl').value;
          const adUrl = document.getElementById('adUrl').value;
          const token = localStorage.getItem('admin_token');

          const res = await fetch('/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, adUrl, token })
          });

          if (res.ok) {
            document.getElementById('imageUrl').value = '';
            document.getElementById('adUrl').value = '';
            loadLinks();
          } else {
            alert('পাসওয়ার্ড সিকিউরিটি ত্রুটি!');
          }

          btn.innerText = 'RUN (লিংক জেনারেট করুন)';
          btn.disabled = false;
        });
      </script>
    </body>
    </html>
  `);
});

// ২. লিংক জেনারেট API (পাসওয়ার্ড যাচাইকরণ সহ)
app.post('/api/create', async (req, res) => {
  try {
    const { imageUrl, adUrl, token } = req.body;
    if (token !== ADMIN_PASS) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const docRef = await addDoc(collection(db, "smart_links"), {
      imageUrl,
      adUrl,
      clicks: 0,
      createdAt: new Date()
    });
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৩. লিংকের তালিকা বের করার API
app.get('/api/links', async (req, res) => {
  try {
    const q = query(collection(db, "smart_links"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const links = [];
    querySnapshot.forEach((doc) => {
      links.push({ id: doc.id, ...doc.data() });
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৪. ইউজার পেজ (ফেসবুক কার্ড, ক্লিক ট্র্যাকিং, ৩ সেকেন্ড টাইমার ও অটো রিডাইরেক্ট)
app.get('/p/:id', async (req, res) => {
  try {
    const linkId = req.params.id;
    const docRef = doc(db, "smart_links", linkId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).send("লিংকটি পাওয়া যায়নি বা মুছে ফেলা হয়েছে।");
    }

    const data = docSnap.data();

    // ক্লিক সংখ্যা ১ বাড়িয়ে দেওয়া
    await updateDoc(docRef, { clicks: increment(1) });

    const currentUrl = `${req.protocol}://${req.get('host')}/p/${linkId}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- ফেসবুক ওপেন গ্রাফ মেটা ট্যাগ -->
        <meta property="og:title" content="Click to view full image">
        <meta property="og:description" content="Click the image to expand and view full content.">
        <meta property="og:image" content="${data.imageUrl}">
        <meta property="og:url" content="${currentUrl}">
        <meta property="og:type" content="website">

        <title>Loading...</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
          .timer-box { font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 15px 25px; border-radius: 30px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2); }
          .count { color: #38bdf8; font-size: 26px; }
          img { max-width: 90%; max-height: 60vh; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); object-fit: contain; }
        </style>
      </head>
      <body>

        <div class="timer-box">
          অপেক্ষা করুন, রিডাইরেক্ট হচ্ছে... <span class="count" id="timer">3</span> সেকেন্ড
        </div>

        <div>
          <img src="${data.imageUrl}" alt="Content Preview">
        </div>

        <script>
          let timeLeft = 3;
          const timerElem = document.getElementById('timer');
          const targetUrl = "${data.adUrl}";

          const countdown = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;
            if (timeLeft <= 0) {
              clearInterval(countdown);
              window.location.href = targetUrl;
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("সার্ভারে সমস্যা হয়েছে।");
  }
});

// ডিফল্ট রাউটকে এডমিনে রিডাইরেক্ট করা
app.get('/', (req, res) => {
  res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
