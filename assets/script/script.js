//global variables
let accounts;
let categories;
let boardgames;

const ls = window.localStorage;

const port = 2090;
const baseUrl = `http://127.0.0.1:${port}`;

//calling the renderPage() function to create the HTML and functionality of the page
renderPage();

//the renderPage() function checks the URL in the browser to see which page the user is on, and calls the right functions 
//to show the content of the pages 
function renderPage() {
  const url = window.location.href;

  //Calls renderNav() function, that generates the HTML for the navigation 
  renderNav();

  // Check if admin or settings is in the URL, if not call renderIndex() that renders the index page
  if (url.indexOf("admin") > -1) {
    renderAdmin();
  } else if (url.indexOf("settings") > -1) {
    renderSettings();
  } else {
    renderIndex();
  }
}

//renderNav() renders the HTML of the navigation and puts it into the header in the index.html file
function renderNav() {
  let content = `
        <nav>
          <ul>
              <li><a href="index.html">Boardgames</a></li>
              <li><a href="index.html?admin">Admin login</a></li>
              <li id="navSettings"><a href="index.html?settings">Settings</a></li>
          </ul>
        </nav>
    `;
  document.querySelector("header").innerHTML += content;
}

//#region renderAdmin() renders the Admin login page
function renderAdmin() {
  const nav = document.querySelector("nav");
  let content = `
        <h1 id="loginTitle">Please log in</h1>
        <div class="loginDiv">
            <div id="loginInput">
                <form action="" id="adminLogin">
                <label for="loginName">Username:</label>
                <input type="text" id="loginName" name="loginName">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password">
                <button type="submit" id="loginBtn" class="btn" value="Login">Login</button>
                </form>
            </div>
            <button type="submit" id="logoutBtn" class="btn" value="Logout">Log out</button>
        </div>
       
    `;

  document.querySelector("body").innerHTML += content;

  //event listener triggered when the content is loaded 
  window.addEventListener("DOMContentLoaded", (e) => {
    const loginBtn = document.querySelector("#loginBtn");
    const logoutBtn = document.querySelector("#logoutBtn");
    const loginInput = document.querySelector("#loginInput");
    const loginTitle = document.querySelector("#loginTitle");
    const navSettings = document.querySelector("#navSettings");
    
    let account;
    
    //if local storage has an "account" item, save it in the account variable 
    if (ls.getItem("account")) {
      account = JSON.parse(ls.getItem("account"));
    }
    
    //if there is no account saved, hide elements that can only be seen by logged in users 
    if (!account) {
      nav.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      navSettings.classList.add("hidden");
    } else { //if logged in, hide elements that are not supposed to be shown when a user is logged in
      loginBtn.classList.add("hidden");
      loginInput.classList.add("hidden");
      loginTitle.innerHTML = "Welcome Admin";
    }
  });

  //event listener triggered when the login button is clicked
  loginBtn.addEventListener("click", (e) => {
    const emailInput = document.querySelector("#loginName");
    const passwordInput = document.querySelector("#password");

    e.preventDefault(); // prevent the button from submitting a form - source: (https://www.w3schools.com/jsref/event_preventdefault.asp)

    loginBtn.style.color = "blue";
    
    //saving the values from the input fields in a payload object
    const payload = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    //saving fetchOptions as an object, specifying the POST method, content-type and request body
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    //fetching the api/accounts/login endpoint with the specified fetchOptions 
    fetch(`${baseUrl}/api/accounts/login`, fetchOptions)
      .then((response) => {
        //saving the authentication token in the browsers local storage
        const token = response.headers.get("x-authentication-token");
        ls.setItem("token", token);

        return response.json();
      })
      .then((data) => {
        // if data have a statusCode of 400 or 401 it should not be set to account in ls
        if (!(data.statusCode == 400) && !(data.statusCode == 401)) {
          ls.setItem("account", JSON.stringify(data));
        }
        window.location.reload();
      });
  });

  //event listener triggered when the log out button is clicked
  //removes the account item and the token from the browsers local storage
  logoutBtn.addEventListener("click", (e) => {
    ls.removeItem("account");
    ls.removeItem("token");

    window.location.reload();
  });
}
//#endregion


//#region renderSettings() renders the settings page for Admins
function renderSettings() {
  let content = `
        <h1 id="settingsTitle">Settings</h1>
        <section class="settingsSection">
            <div id="showEmail">

                <!-- <p>Email: admin@hotmail.com</p> -->
            </div>
            <section class="changePasswordSection">
                <input type="password" placeholder="Password" id="changePasswordInput">
                <button type="submit" id="changePassword">Change password</button>
            </section>

            <section class="accountsSection">
                <h2>Accounts</h2>

                <section id="addProfile">
                    <h3>Add new account:</h3>
                    <input type="email" placeholder="Email" id="createProfileEmail">
                    <input type="password" placeholder="Password" id="createProfilePassword">
                    <button type="submit" id="createProfileBtn">+</button>
                </section>

                <section class="deleteAccountsSection">
                    <h3>Delete existing accounts:</h3>
                    <div class="accounts">
                    </div>
                </section>
            </section>
        </section>
    `;

  document.querySelector("body").innerHTML += content;

  //event listener triggered when the content is loaded 
  window.addEventListener("DOMContentLoaded", (e) => {
    //calling functions showEmail() and accountList()
    showEmail();
    accountlist();

    const settingsSection = document.querySelector(".settingsSection");
    const settingsTitle = document.querySelector("#settingsTitle");
    const navSettings = document.querySelector("#navSettings");

    let account;
    if (ls.getItem("account")) {
      account = JSON.parse(ls.getItem("account"));
    }
    //hides elements not supposed to be seen, if a user is not logged in 
    if (!account) { 
      settingsSection.classList.add("hidden");
      settingsTitle.innerHTML = "NOT LOGGED IN";
      navSettings.classList.add("hidden");
    } 
  });

  //showEmail() function shows the user their own email address when they load the settings page
  function showEmail() {
    // saving fetchOptions as an object, specifying the GET method and content-type
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${baseUrl}/api/accounts/own`, fetchOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        let email = `<p>Email: ${data.email}</p>`;
        document.querySelector("#showEmail").innerHTML = email;
      });
  }

  const changePassword = document.querySelector("#changePassword");

  //event listener triggered by clicking the "password" button
    changePassword.addEventListener("click", (e) => {
    e.preventDefault(); // prevent the button from submitting a form - source: (https://www.w3schools.com/jsref/event_preventdefault.asp)
    if (!confirm("Are you sure you want to update your password?")) {
      return; // if cancelled we should not continue with updating the password and should therefore return
    }
    
    //takes the password from the input field and saves it in the password variable 
    const changePasswordInput = document.querySelector("#changePasswordInput");
    const password = {
      password: changePasswordInput.value,
    };

    //saving fetchOptions as an object, specifying the PUT method, content-type and request body
    const fetchOptions = {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(password),
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${baseUrl}/api/accounts/own`, fetchOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        location.reload();
      });
  });

  //accountList() function gets a list of accounts from the api/accounts endpoint and shows them on the page
  function accountlist() {
    //saving fetchOptions as an object, specifying the GET method and content-type
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };

    //sets x-authentication-token in the fetchOptions headers, if it exists 
    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }
    fetch(`${baseUrl}/api/accounts`, fetchOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        accounts = data;
        let content = ``;
        data.forEach((account) => {
          content += `
            <div class="account-list">
                  <p>${account.email}</p>
                  <button id="trashBtnAccount${account.accountid}" class="trashBtnAccount"><i class="fa-solid fa-trash-can"></i></button>
            </div>
                  `;
        });

        document.querySelector(".accounts").innerHTML = content;

        const trashBtnAccount = document.querySelectorAll(".trashBtnAccount");
        //event listener triggered by the trash button, where the admin can delete accounts 
        trashBtnAccount.forEach((trashAccount) => {
          trashAccount.addEventListener("click", (e) => {

            if (!confirm("Are you sure you want to delete the account?")) {
              return; // if cancelled we should not continue with deleting the account and should therefore return
            }

            const trashAccountId = e.currentTarget.id; // get the id from the trashIcon we clicked on
            const accountid = trashAccountId.replace("trashBtnAccount", ""); // the id is `trashBtnAccount${account.accountid}` so if "trashBtnAccount" is removed, we have the accountid

            //defining fetchOptions
            const fetchOptions = {
              method: "DELETE",
              headers: {
                "Content-type": "application/json",
              },
            };

            //if there is a token, set the x-authentication-token in the header
            if (ls.getItem("token")) {
              fetchOptions.headers["x-authentication-token"] =
                ls.getItem("token");
            }
            
            //fetches api/accounts/:accountid endpoint to delete specific account 
            fetch(`${baseUrl}/api/accounts/${accountid}`, fetchOptions)
              .then((response) => response.json())
              .then((data) => {
                location.reload();
              });
          });
        });
      });
  }

  const createProfileBtn = document.querySelector("#createProfileBtn");
  const createProfileEmail = document.querySelector("#createProfileEmail");
  const createProfilePassword = document.querySelector("#createProfilePassword");

  //event listener triggered by clicking the create profile button 
  createProfileBtn.addEventListener("click", (e) => {
    //defining the email and password input field values as an object
    let data = {
      email: createProfileEmail.value,
      password: createProfilePassword.value,
    };

    //defining fetchOptions, putting the data in the request body
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    };

    //getting the authentication token from local storage 
    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    //fetching the api/accounts endpoint with the fetchoptions
    //posting the new account to the DB 
    fetch(`${baseUrl}/api/accounts`, fetchOptions)
      .then((response) => response.json())
      .then((data) => {
        alert(JSON.stringify(data));
        location.reload();
      });
  });
}
// #endregion
//#region renderIndex() renders the Index page 
function renderIndex() {
  let content = `
        <h1 class="title-of-page">Welcome to the Boardgame Picker!</h1>
        <p class="pCentered">Filter the board games or leave blank to see all. The list will appear below this form.</p>
        <section class="filtre">
        <form action="" class="form-container">
            <label for="players"><b>How many players are you?</b></label>
            <input type="number" id="playersInput" />
            <label for="categories"><b>Pick which categories you're interested in:</b></label>
            <div name="categories" class="categories"></div>
            <label for="time"><b>How much time do you have? (In minutes)</b></label>
            <input type="number" name="time" id="timeInput" />
            <label for="age"><b>How old is the youngest player?</b></label>
            <input type="number" name="age" id="ageInput" />
            <button type="submit" class="btn" id="submitBtn">Submit</button>
        </form>
        </section>
    
        <section id="addNewBoardgameSection">
        <p>Add new boardgame</p>
        <button id="addBoardgameBtn"><i class="fa-solid fa-plus"></i></button>
        </section>
    
    
        <section id="boardgameSection">
        </section>
        <section id="updateBoardgame">
        </section>
        <section id="addBoardgame" class="filtre">
        <form action="" class="create-update-container">
            <label for="boardgametitle"><b>Boardgame title</b></label>
            <input id="addTitle" name="boardgametitle" type="text" />
            <label for="imageurl"><b>Imageurl</b></label>
            <input id="addImageurl" name="imageurl" type="text" />
            <label for="description"><b>Description</b></label>
            <textarea id="addDescription" name="description" class="description-textarea"></textarea>
            <label class="categories-label" for="categories"><b>Categories</b></label>
            <div name="categories" id="addBoardgameCategories" class="categories form2-categories">
            </div>
            <div id="addBoardgameNumbers">
            <div class="form-minage">
                <label for="age"><b>Minimum age</b></label>
                <input id="addAge" type="number" name="age" />
            </div>
            <div class="form-mintime">
            <label for="mintime"><b>Minimum time</b></label>
            <input id="addMinTime" type="number" name="mintime" />
            </div>
            <div class="form-minplayers">
            <label for="minplayers"><b>Minimum players</b></label>
            <input id="addMinPlayers" type="number" name="minplayers" />
            </div>
            <div class="form-maxtime">
            <label for="maxtime"><b>Maximum time</b></label>
            <input id="addMaxTime" type="number" name="maxtime" />
            </div>
            <div class="form-maxplayers">
            <label for="maxplayers"><b>Maximum players</b></label>
            <input id="addMaxPlayers" type="number" name="maxplayers" />
            </div>
            </div>
    
            <button type="submit" value="Submit" class="btn" id="submitAddBoardgame">Submit</button>
        </form>
        </section>
        
    `;

  document.querySelector("body").innerHTML += content;

  //when the page is loaded, the createCategoryList() function is called
  window.addEventListener("DOMContentLoaded", (e) => {
    createCategoryList();

    const addNewBoardgame = document.querySelector("#addNewBoardgameSection");
    const navSettings = document.querySelector("#navSettings");

    let account;
    if (ls.getItem("account")) {
      account = JSON.parse(ls.getItem("account"));
    }
    if (!account) { //if there is no account saved, hide elements that can only be seen by logged in users 
      addNewBoardgame.style.display = "none";
      navSettings.style.display = "none";
    } 
  });

  //creates all checkboxes for the categories, by fetching the categories from the api 
  function createCategoryList() {
    //saving fetchOptions as an object, specifying the GET method and content-type
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };
    fetch(`${baseUrl}/api/categories`, fetchOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        categories = data;
        let content = ``;
        data.forEach((category) => {
          content += `
                    <div>
                    <input type="checkbox" id="category${category.categoryid}" name="${category.categoryname}" value="${category.categoryname}">
                    <label for="${category.categoryname}">${category.categoryname}</label>
                    </div>
                `;
        });
        document.querySelector(".categories").innerHTML = content;
      });
  }
  
  const submitBtn = document.querySelector("#submitBtn");
  //event listener triggered by clicking the submit button 
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault(); // prevent the button from submitting a form - source: (https://www.w3schools.com/jsref/event_preventdefault.asp)

    const playersInput = document.querySelector("#playersInput");
    const timeInput = document.querySelector("#timeInput");
    const ageInput = document.querySelector("#ageInput");

    //creating a query string for the get request based on the input values in the form 
    let queryString = `${baseUrl}/api/boardgames?`;

    if (playersInput.value) {
      queryString += `&players=${playersInput.value}`;
    }

    if (timeInput.value) {
      queryString += `&time=${timeInput.value}`;
    }

    if (ageInput.value) {
      queryString += `&minage=${ageInput.value}`;
    }

    // array for checked categories
    let checkedCategories = []; 
    // loop through categories to access the categoryid in order to get the checkbox elements
    categories.forEach((element) => { 
      const checkBox = document.getElementById(`category${element.categoryid}`);
      if (checkBox.checked == true) { // if checkbox is checked it should be added to checkedCategories array
        checkedCategories.push(checkBox);
      }
    });

    // if there are more than one checked category, we need to build a queryString where the categories are seperated by comma
    if (checkedCategories.length > 1) { 
      queryString += `&category=`;
      checkedCategories.forEach((checkbox) => {
        queryString += `${checkbox.name},`;
      });
      queryString = queryString.replace(/.$/, ""); // remove last character ',' - source: (https://masteringjs.io/tutorials/fundamentals/remove-last-character)
    }
    
    // if there is only one checked category
    if (checkedCategories.length == 1) {
      queryString += `&category=${checkedCategories[0].name}`;
    }

    //fetching the board games with the query string and creating html for the response data
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };
    fetch(`${queryString}`, fetchOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        boardgames = data;
        let content = ``;
        content += `<p class="resultsP">${data.length} results</p>`;
        data.forEach((game) => {
          content += `
            <article id="boardgame${game.boardgameid}" class="boardgame-container">
              <img src="${game.imageurl}" alt="Image of ${game.title}" class="boardgameTitle" />
              <div class="boardgameEdit">
                <h2>${game.title}</h2>
                <div class="editIcons">
                  <button id="trashCanBtn${game.boardgameid}" class="trashCanBtn"><i class="fa-solid fa-trash-can"></i></button>
                  <button id="editBtn${game.boardgameid}" class="editBtn"><i class="fa-solid fa-pen-to-square"></i></button>
                </div>
              </div>
    
              <p class="boardgameDescription">
              ${game.bgdescription}
              </p>
              <div>
                <div><b>Category</b>:`;

          game.categories.forEach((category) => {
            content += `
                  ${category.categoryname},`;
          });

          content.trim();
          content = content.replace(/.$/, ""); // remove last character ',' - source: (https://masteringjs.io/tutorials/fundamentals/remove-last-character)

          content += `
              </div>
                </div>
              <div class="small-info">
                <div>
                  <i class="fa-solid fa-users"></i>
                  <p>${game.minplayers}-${game.maxplayers}</p>
                </div>
                <div>
                  <i class="fa-solid fa-hourglass-end"></i>
                  <p>${game.mintime}-${game.maxtime}</p>
                </div>
                <div>
                  <i class="fa-solid fa-child"></i>
                  <i class="fa-solid fa-person-cane"></i>
                  <p>${game.minage}+</p>
                </div>
              </div>
            </article>
              `;
        });
        const boardgameSection = document.querySelector("#boardgameSection");
        boardgameSection.innerHTML = content;

        const editIcons = document.querySelectorAll(".editIcons");

        let account;
        if (ls.getItem("account")) {
          account = JSON.parse(ls.getItem("account"));
        }
        if (!account) { //if there is no account saved, hide elements that can only be seen by logged in users 
          editIcons.forEach((icons) => {
            icons.style.display = "none";
          });
        } 

        const trashCanBtn = document.querySelectorAll(".trashCanBtn");
        const editBtn = document.querySelectorAll(".editBtn");

        //adding event listeners to all trash can buttons next to the board games, that allows the admin users to delete games from the DB with the API 
        trashCanBtn.forEach((trashCan) => {
          trashCan.addEventListener("click", (e) => {
            if (!confirm("Are you sure you want to delete the boardgame?")) {
              return; //if cancelled we should not continue with deleting the boardgame and should therefore return
            }

            const trashCanId = e.currentTarget.id; // the id of the trashcan icon we clicked on
            const boardgameId = trashCanId.replace("trashCanBtn", ""); // the id is `trashCanBtn${game.boardgameid}` so if "trashCanBtn" is removed, we have the boardgameid

            const fetchOptions = {
              method: "DELETE",
              headers: {
                "Content-type": "application/json",
              },
            };

            if (ls.getItem("token")) {
              fetchOptions.headers["x-authentication-token"] =
                ls.getItem("token");
            }

            fetch(`${baseUrl}/api/boardgames/${boardgameId}`, fetchOptions)
              .then((response) => response.json())
              .then((data) => {
                if (data.statusCode) {
                  alert(data.errorMessage);
                } else {
                  alert(
                    `Boardgame ${data.title} has been successfully deleted`
                  );
                  location.reload();
                }
              });
          });
        });

        //adding event listeners to the edit button next to each board game, allowing admin users to edit boardgames in the database
        editBtn.forEach((editBtn) => {
          editBtn.addEventListener("click", (e) => {
            const editBtnId = e.currentTarget.id; // the id of the edit icon we clicked on
            const boardgameId = editBtnId.replace("editBtn", ""); // the id is `editBtn${game.boardgameid}` so if "editBtn" is removed, we have the boardgameid

            let updateBoardgame = ``;

            boardgames.forEach((element) => {
              if (element.boardgameid == boardgameId) {
                updateBoardgame = `
                  <form action="" class="create-update-container update-form">
                    <label for="imageurl"><b>Imageurl</b></label>
                    <input id="updateImageurl" name="imageurl" type="text" value="${element.imageurl}" />
                    <label for="boardgametitle"><b>Boardgame title</b></label>
                    <input id="updateTitle" name="boardgametitle" type="text" value="${element.title}"/>
                    <label for="description"><b>Description</b></label>
                    <textarea id="updateDescription" name="description" class="description-textarea">${element.bgdescription}</textarea>
                    <label class="categories-label" for="categories"><b>Category</b></label>
                    <div name="categories" id="updateBoardgameCategories" class="categories form2-categories">
                    
                    `;
                categories.forEach((category) => {
                  if ( // we check if the categories array in boardgames has categoryid that is equal to the categoryid - source: (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
                    element.categories.some(
                      (e) => e.categoryid === category.categoryid
                    )
                  ) {
                    updateBoardgame += `
                        <div>
                        <input type="checkbox" id="updateCategory${category.categoryid}" class="updateCategory" name="${category.categoryname}" value="${category.categoryname}" checked="true">
                        <label for="${category.categoryname}">${category.categoryname}</label>
                        </div>
                        `;
                  } else {
                    updateBoardgame += `
                        <div>
                        <input type="checkbox" id="updateCategory${category.categoryid}" class="updateCategory" name="${category.categoryname}" value="${category.categoryname}">
                        <label for="${category.categoryname}">${category.categoryname}</label>
                        </div>
                        `;
                  }
                });

                updateBoardgame += `
                    </div>
                    <div id="addBoardgameNumbers">
                      <div class="form-minage">
                        <label for="age"><b>Minimum age</b></label>
                        <input id="updateAge" type="number" name="age" value="${element.minage}"/>
                      </div>
                      <div class="form-minplayers">
                        <label for="minplayers"><b>Min players</b></label>
                        <input id="updateMinPlayers" type="number" name="minplayers" value="${element.minplayers}" />
                      </div>
                      <div class="form-maxplayers">
                        <label for="maxplayers"><b>Max players</b></label>
                        <input id="updateMaxPlayers" type="number" value="${element.maxplayers}" name="maxplayers"  />
                      </div>
                      <div class="form-mintime">
                        <label for="mintime"><b>Minimum time</b></label>
                        <input id="updateMinTime" type="number" value="${element.mintime}" name="mintime"/>
                      </div>
                      <div class="form-maxtime">
                        <label for="maxtime"><b>Maximum time</b></label>
                        <input id="updateMaxTime" type="number" value="${element.maxtime}" name="maxtime"/>
                      </div>
                    </div>
                    <button type="submit" value="Submit" class="btn" id="submitUpdateBoardgame${boardgameId}" class="submitUpdateBoardgame">Submit</button>
                  </form>
                  `;
              }
            });

            document.querySelector(`#boardgame${boardgameId}`).innerHTML +=
              updateBoardgame;

            const submitUpdateBoardgame = document.querySelector(
              `#submitUpdateBoardgame${boardgameId}`
            );

            //event listener for the submit boardgame button, allowing admins to update boardgames in the DB 
            submitUpdateBoardgame.addEventListener("click", (e) => {
              e.preventDefault(); // prevent the button from submitting a form - source: (https://www.w3schools.com/jsref/event_preventdefault.asp)
              let checkedCategories = [];

              // getting all the checkboxes from when updating a boardgame
              updateCategories = document.querySelectorAll(".updateCategory");

              // looping through the checkboxes to get all the checked ones
              updateCategories.forEach((category) => {
                if (category.checked == true) { // creating an object for all checked categories
                  const checkedCategoryId = category.id.replace("updateCategory", ""); // the id of the category is `updateCategory${categoryid}` so if "updateCategory" is removed, we have the categoryid
                  checkedCategory = {
                    categoryid: checkedCategoryId,
                    categoryname: category.name,
                  };
                  // add category object to checkedCategories
                  checkedCategories.push(checkedCategory); 
                }
              });

              const updateTitle = document.querySelector("#updateTitle");
              const updateImageurl = document.querySelector("#updateImageurl");
              const updateDescription =
                document.querySelector("#updateDescription");
              const updateMinPlayers =
                document.querySelector("#updateMinPlayers");
              const updateMaxPlayers =
                document.querySelector("#updateMaxPlayers");
              const updateMinTime = document.querySelector("#updateMinTime");
              const updateMaxTime = document.querySelector("#updateMaxTime");
              const updateAge = document.querySelector("#updateAge");

              let data = {
                title: updateTitle.value,
                imageurl: updateImageurl.value,
                bgdescription: updateDescription.value,
                minplayers: updateMinPlayers.value,
                maxplayers: updateMaxPlayers.value,
                mintime: updateMinTime.value,
                maxtime: updateMaxTime.value,
                minage: updateAge.value,
                categories: checkedCategories,
              };

              const fetchOptions = {
                method: "PUT",
                headers: {
                  "Content-type": "application/json",
                },
                body: JSON.stringify(data),
              };

              if (ls.getItem("token")) {
                fetchOptions.headers["x-authentication-token"] =
                  ls.getItem("token");
              }

              fetch(`${baseUrl}/api/boardgames/${boardgameId}`, fetchOptions)
                .then((response) => response.json())
                .then((data) => {
                  if (data.code == "EREQUEST") {
                    alert(
                      `${data.name}. Please check you filled out all the information.`
                    );
                  } else if (data.statusCode) {
                    alert(data.errorMessage);
                  } else {
                    alert(
                      `Boardgame ${data.title} has been successfully updated.`
                    );
                    location.reload();
                  }
                });
            });
          });
        });
      });
  });

  const addBoardgameBtn = document.querySelector("#addBoardgameBtn");
  //event listener triggered by clicking the add boardgame button, allowing admin users to post new boardgames to the DB 
  addBoardgameBtn.addEventListener("click", (e) => {
    const addBoardgame = document.querySelector("#addBoardgame");
    addBoardgame.style.display = "block";

    let categoriesContent = ``;
    categories.forEach((category) => {
      categoriesContent += `
                <div>
                <input type="checkbox" id="postCategory${category.categoryid}" name="${category.categoryname}" value="${category.categoryname}">
                <label for="${category.categoryname}">${category.categoryname}</label>
                </div>
            `;
    });
    document.querySelector("#addBoardgameCategories").innerHTML =
      categoriesContent;

    const submitAddBoardgame = document.querySelector("#submitAddBoardgame");
    submitAddBoardgame.addEventListener("click", (e) => {
      e.preventDefault(); // prevent the button from submitting a form - source: (https://www.w3schools.com/jsref/event_preventdefault.asp)
      let checkedCategories = [];

      // looping through categories to access the checkbox elements with the categoryid
      categories.forEach((element) => {
        const checkBox = document.getElementById(
          `postCategory${element.categoryid}`
        );
        if (checkBox.checked == true) { // if the checkbox is checked it should be added to checkedCategories
          checkedCategories.push(element);
        }
      });

      const addTitle = document.querySelector("#addTitle");
      const addImageurl = document.querySelector("#addImageurl");
      const addDescription = document.querySelector("#addDescription");
      const addAge = document.querySelector("#addAge");
      const addMinPlayers = document.querySelector("#addMinPlayers");
      const addMaxPlayers = document.querySelector("#addMaxPlayers");
      const addMinTime = document.querySelector("#addMinTime");
      const addMaxTime = document.querySelector("#addMaxTime");

      let data = {
        title: addTitle.value,
        imageurl: addImageurl.value,
        bgdescription: addDescription.value,
        categories: checkedCategories,
        minplayers: addMinPlayers.value,
        maxplayers: addMaxPlayers.value,
        mintime: addMinTime.value,
        maxtime: addMaxTime.value,
        minage: addAge.value,
      };

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(data),
      };

      if (ls.getItem("token")) {
        fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
      }

      fetch(`${baseUrl}/api/boardgames`, fetchOptions)
        .then((response) => response.json())
        .then((data) => {
          if (data.code == "EREQUEST") {
            alert(
              `${data.name}. Please check you filled out all the information.`
            );
          } else if (data.statusCode) {
            alert(data.errorMessage);
          } else {
            alert(`Boardgame ${data.title} has been successfully added.`);
            location.reload();
          }
        });
    });
  });
}
// #endregion