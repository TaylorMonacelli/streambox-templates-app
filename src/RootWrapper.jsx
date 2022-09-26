import React, { useState, useEffect } from "react"
import App from "./App"
import Navbar from "./components/Navbar"
import Settings from "./Settings"
import { authenticate } from "./Utils"

export default function RootWrapper() {
    //is this in dev environment or prod?
    let isLocalDev = false

    //set up initial state with template
    const [currentTemplate, setCurrentTemplate] = useState([])
    const [templateName, setTemplateName] = useState(
        localStorage.getItem("templateName")
    )
    const [navBtns, setNavBtns] = useState([])
    const [isSettings, setIsSettings] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPageName, setCurrentPageName] = useState("")
    let endpoint = ""

    //if developing on local machine, reach out to REST api on remote machine
    if (isLocalDev) {
        const hostname = "184.106.155.61"
        //moving port number
        const port = "5970"
        endpoint = `http://${hostname}:${port}`
    } else {
        endpoint = location.origin
    }

    function handleChangeTemplate(selectedTemplate) {
        setTemplateName(selectedTemplate)
    }

    function changeRoute(routeName) {
        setCurrentPageName(routeName)
    }

    function openSettings() {
        setIsSettings(true)
        setCurrentPageName("Settings")
    }

    async function getTemplate() {
        if (!isLocalDev) {
            let authorized = await authenticate()
            if (!authorized) {
                //authenticate with remote server
                window.location = `${endpoint}/sbuiauth/`

                //authenticate with local server
                //window.location = "http://localhost:5005/sbuiauth/"
                return
            }
        }

        if (localStorage.getItem("templateName")) {
            try {
                let response = await fetch(
                    `${endpoint}/REST/templates/${localStorage.getItem(
                        "templateName"
                    )}`
                )
                let json = await response.json()

                setCurrentTemplate(JSON.stringify(json))
                setNavBtns(json.template.navbar.routes)

                if (isSettings) {
                    setCurrentPageName("Settings")
                } else {
                    setCurrentPageName(json.template.navbar.routes[0].routeName)
                }
            } catch (err) {
                alert(
                    "There was a problem with the JSON file. Please choose another."
                )
                setCurrentTemplate([])
                setNavBtns([])
                openSettings(true)
                setIsLoading(false)
            }
            setIsLoading(false)
        } else {
            //set json template to fallback if none are chosen
            let fallbackTemplateName = isLocalDev
                ? "Dark Dev Template"
                : "Dark Prod Template (Default)"

            localStorage.setItem("templateName", fallbackTemplateName)
            setTemplateName(fallbackTemplateName)

            // setCurrentTemplate([])
            // setNavBtns([])
            // openSettings(true)
            // setIsLoading(false)
        }
    }

    useEffect(() => {
        getTemplate()
    }, [templateName])

    useEffect(() => {
        const navBtnDOMObj = document.getElementsByClassName("nav-btn")
        //highlight link
        for (let i = 0; i < navBtnDOMObj.length; i++) {
            if (navBtnDOMObj[i].innerText === currentPageName) {
                navBtnDOMObj[i].classList.add("selected-route")
                if (isSettings) {
                    setIsSettings(false)
                    document
                        .querySelector(".settings-btn")
                        .classList.remove("selected-route")
                }
            }
        }
    }, [currentPageName])

    return (
        <>
            {isLoading ? (
                <div className="roller-container">
                    <div className="lds-roller">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            ) : (
                <>
                    <Navbar
                        changeRoute={changeRoute}
                        openSettings={openSettings}
                        currentPageName={currentPageName}
                        navBtns={navBtns}
                    />
                    {isSettings ? (
                        <Settings
                            endpoint={endpoint}
                            handleChangeTemplate={handleChangeTemplate}
                        />
                    ) : (
                        <App
                            openSettings={openSettings}
                            currentPageName={currentPageName}
                            currentTemplate={JSON.parse(currentTemplate)}
                        />
                    )}
                </>
            )}
        </>
    )
}
