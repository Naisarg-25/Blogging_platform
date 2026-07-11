const api = "http://localhost:3000";
let token = localStorage.getItem("token");

const authSection = document.getElementById("authSection");
const blogSection = document.getElementById("blogSection");
const welcome = document.getElementById("welcome");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPass = document.getElementById("signupPass");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");
const title = document.getElementById("title");
const content = document.getElementById("content");

function getusername(){
    if(!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.name;
    } catch (err) {
        console.error("Invalid token", err);
        return null;
    }
}

function showAuthenticatedUI(){
    const username = getusername();
    if (username) {
        authSection.style.display = "none";
        blogSection.style.display = "block";
        welcome.textContent = `Welcome, ${username}`;
        loadpost();
        scrollToBlog();
    } else {
        authSection.style.display = "block";
        blogSection.style.display = "none";
        welcome.textContent = "";
        document.getElementById("posts").innerHTML = "";
    }
}

function scrollToBlog(){
    if (blogSection.style.display !== "none") {
        blogSection.scrollIntoView({ behavior: "smooth" });
    }
}

function loadpost(){
    if(!token) return;

    axios.get(`${api}/posts`)
        .then(res => {
            const postdiv = document.getElementById("posts");
            postdiv.innerHTML = "";
            res.data.forEach(p => {
                postdiv.innerHTML += `
                <div class="post">
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                    <small> By ${p.author} on ${new Date(p.date).toLocaleString()}</small>
                    ${p.author === getusername() ? `
                        <button onclick="editpost('${p._id}', '${p.title.replace(/'/g, "\\'")}')">Edit</button>
                        <button onclick="deletepost('${p._id}')">Delete</button>` : ""}
                </div>`;
            });
        })
        .catch(err => console.error("Failed to load posts", err));
}

document.getElementById('signupForm').addEventListener("submit", e => {
    e.preventDefault();
    axios.post(`${api}/signup`, {
        name: signupName.value, email: signupEmail.value, password: signupPass.value
    })
    .then(() => alert("Signup Successful"))
    .catch(err => alert(err.response?.data?.msg || "Signup failed"));
});

document.getElementById('loginForm').addEventListener("submit", e => {
    e.preventDefault();
    axios.post(`${api}/login`, {
        email: loginEmail.value, password: loginPass.value
    })
    .then(res => {
        token = res.data.token;
        localStorage.setItem("token", token);
        alert("Login Successful");
        showAuthenticatedUI();
    })
    .catch(err => alert(err.response?.data?.msg || "Login failed"));
});

document.getElementById('postForm').addEventListener("submit", e => {
    e.preventDefault();
    if(!token) return alert("Please login first.");

    axios.post(`${api}/posts`, {
        title: title.value,
        content: content.value
    }, { headers: { Authorization: `Bearer ${token}` } })
    .then(() => {
        title.value = "";
        content.value = "";
        loadpost();
    })
    .catch(err => alert(err.response?.data?.msg || "Failed to add post"));
});

function editpost(id, currentTitle){
    const newtitle = prompt("Enter new title", currentTitle);
    if(!newtitle) return;
    axios.put(`${api}/posts/${id}`, { title: newtitle }, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => loadpost())
        .catch(err => alert(err.response?.data?.msg || "Failed to update post"));
}

function deletepost(id){
    axios.delete(`${api}/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => loadpost())
        .catch(err => alert(err.response?.data?.msg || "Failed to delete post"));
}

function logout(){
    localStorage.removeItem("token");
    token = null;
    alert("Logged out");
    showAuthenticatedUI();
}

showAuthenticatedUI(); 