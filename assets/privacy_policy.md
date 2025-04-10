### Privacy Policy

This privacy policy explains how the extension handles information. 
> No data leaves your local system!!

----

#### Information Accessed
This extension needs to access specific information to function correctly, but it **does not collect or store personal data or browsing history.**

1.  **Google Search URLs:**
    *   When you navigate to a Google Search results page (`google.com`, `google.co.uk`, `google.co.in`, etc.), the extension temporarily reads the URL using the `webNavigation` and `tabs` permissions.
    *   **Purpose:** This access is solely to check if the URL needs modification based on your chosen settings (adding `-ai` to the query or `udm=14` to the parameters).
    *   **Handling:** This URL access is **ephemeral** (temporary) and processed **locally within your browser**. The developer **do not and cannot** store, log, transmit, or share these URLs or any part of your browsing history.

2.  **User Configuration Settings:**
    *   The extension stores your preferences (whether the extension is globally enabled/disabled and which modification mode - `-ai`, `udm14`, or `none` - is active) using the `chrome.storage.sync` API.
    *   **Purpose:** This allows your chosen settings to be saved between browser sessions and potentially synced across devices if you are logged into your Google account in Chrome.
    *   **Handling:** These settings are stored locally by your browser as part of Chrome's storage mechanisms. They are not transmitted to the developer or any third party.

#### How Information is Used

The information accessed is used strictly for the core functionality of the extension:

*   To modify Google Search URLs locally in your browser according to the preferences you set.
*   To save and load your preferences for the extension's operation.

----

#### Information Storage

*   **Your Preferences:** The only data persistently stored by this extension are your configuration settings, managed by `chrome.storage.sync`.
*   **No Other Data:** No browsing history, URLs, search queries, personal information, or any other user data is stored, logged, or collected by this extension.

#### Information Sharing

The developer **do not and cannot** share, sell, rent, or transfer any user data (including configuration settings or accessed URLs) with any third parties. All **processing occurs locally within your browser**.

#### Security

It rely on the security measures built into your browser and the Chrome Extension platform. As the extension **does not collect or transmit sensitive user data**, the primary security measure is this minimal data handling approach.

----

#### Changes to This Policy

This Privacy Policy may have minor updates occasionally if any new features require any new permissions or if the permission requirements are changed to maintain functionality. Any changes will be reflected by updating this document in this repository. You are encourage to review the policy from time to time.

That said, one thing will never change: **No data will ever leave your machine.**