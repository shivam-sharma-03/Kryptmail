# Kryptmail: End-to-End Encrypted Email Service 📧🔒

![Kryptmail Banner](https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif)

### **KryptMail is an E2EE email system ensuring that plaintext email data is never sent to the server. It follows a zero-access security model, using RSA and AES for encryption and additional security measures like the Zero-Knowledge Proof protocol.**

---

## 🌟 Project Overview and Motivation

In the digital age, email communication is a fundamental part of our personal and professional lives. However, the confidentiality of email content is often at risk. When messages are stored in plaintext on company servers, sensitive personal and corporate information becomes vulnerable to data breaches and unauthorized access.

**Kryptmail** was built to solve this problem head-on. We believe that your conversations are yours alone. Our solution implements a **zero-access, end-to-end encryption (E2EE)** model, which means that nobody but you and your intended recipient—not even us—can read your emails. By leveraging robust cryptographic standards like **RSA** for key exchange and **AES** for message encryption, Kryptmail ensures your data remains secure and private from the moment you hit "send."

---

## 🎯 Features

### Core MVP Features
* 🔐 **End-to-End Encryption:** Utilizes a powerful combination of **RSA-2048** for asymmetric key exchange and **AES-256** for symmetric encryption of email content.
* 🔌 **Seamless Browser Integration:** A lightweight browser extension that integrates directly with popular web clients like **Gmail** and **Outlook**.
* ⚡ **Real-Time Encryption & Decryption:** The extension works transparently within the email client's interface, encrypting messages as you compose them and decrypting them as you read.
* 🔑 **Secure Key Management:** Automatic generation and secure local storage of user public/private key pairs upon registration.
* 👤 **Zero-Knowledge Authentication:** A secure authentication protocol that verifies user identity without ever transmitting passwords in plaintext.

### Long-Term Vision
* Metadata Encryption to hide sender/recipient information.
* Support for encrypted attachments (files, images).
* Development of standalone desktop and mobile applications.
* Advanced features like encrypted group messaging and self-destructing emails.
* Integration with hardware security keys (e.g., YubiKey) for enhanced private key protection.

---

## 🏗 System Architecture

Kryptmail's architecture is designed for security and separation of concerns. The client-side extension handles all cryptographic operations, ensuring unencrypted data never leaves the user's device.

![System Architecture Diagram](https://i.imgur.com/gU82uXv.png)

### Component Breakdown:
* **Client (Browser Extension):** The user-facing component responsible for the UI, real-time encryption/decryption, and managing user keys locally.
* **Authentication:** Verifies user credentials using a Zero-Knowledge Proof protocol before granting access.
* **Key Management:** A secure service for storing users' public keys, allowing others to find them to initiate encrypted communication. Private keys **never** leave the client.
* **Web Server (Node.js/Express):** The backend API that handles user registration, authentication requests, and routes encrypted email data.
* **SMTP Server:** Standard mail transfer agent responsible for sending the (already encrypted) email payloads across the internet.
* **IMAP Server:** Standard protocol used to retrieve encrypted email payloads from mail storage.
* **Mail Storage:** The database where the encrypted email content is stored.

---

## ⚙ Core Workflow/Protocol

The core protocol ensures that plaintext data is never exposed to any server-side component.

### Sending an Encrypted Email:
1.  **Compose:** The user composes a message in the standard email interface (e.g., Gmail).
2.  **Fetch Public Key:** The Kryptmail extension automatically fetches the recipient's public key from the **Key Management** service.
3.  **Encrypt:**
    * A unique, one-time **AES-256 session key** is generated.
    * The email body is encrypted using this AES session key.
    * The AES session key itself is then encrypted using the recipient's **RSA public key**.
4.  **Transmit:** The encrypted email body and the encrypted session key are bundled together and sent to the **Web Server**, which forwards it via the standard **SMTP** protocol.

### Receiving an Encrypted Email:
1.  **Fetch Email:** The user's email client retrieves the encrypted message payload via the **IMAP Server**.
2.  **Recognize & Activate:** The Kryptmail extension detects the encrypted message format and activates.
3.  **Decrypt:**
    * The extension uses the user's **local private RSA key** to decrypt the AES session key.
    * With the decrypted session key, the extension decrypts the email body.
4.  **Display:** The plaintext message is displayed securely in the user's browser. The plaintext is never stored anywhere except in the temporary memory of the browser tab.

---

## 💻 Requirements

### Prerequisites
* **Node.js** (v18.x or later)
* **npm** or **yarn**
* **MongoDB** (running locally or via a cloud service like MongoDB Atlas)
* A modern web browser that supports extensions (e.g., Chrome, Firefox, Edge)

### Key Libraries & Frameworks

| Category  | Technology/Library                                 | Purpose                                   |
| :-------- | :------------------------------------------------- | :---------------------------------------- |
| **Backend** | `Node.js`, `Express.js`                            | Server runtime and API framework          |
| **Database** | `MongoDB`, `Mongoose`                              | NoSQL database and Object Data Modeling (ODM) |
| **Frontend** | `React.js`                                         | UI library for the browser extension      |
| **Security** | `bcrypt.js`, `jsonwebtoken`                        | Password hashing and session management   |
| **Crypto** | `node-forge` or similar                          | RSA & AES cryptographic operations        |

---

## 🛠 Installation and Usage

Follow these steps to set up the project locally for development.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/kryptmail.git](https://github.com/your-username/kryptmail.git)
cd kryptmail
```

### 2. Install Backend Dependencies
Navigate to the server directory and install the required packages.

```bash
cd server
npm install```bash
git clone [https://github.com/your-username/kryptmail.git](https://github.com/your-username/kryptmail.git)
cd kryptmail
```

### 3. Configure Environment Variables
Create a .env file in the /server directory and add your configuration details.

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 4. Run the Backend Server

```bash
npm start
```
The server should now be running on http://localhost:5000.

### 5. Install Frontend (Extension) Dependencies
Navigate to the extension directory and install its packages.

```bash
cd ../extension
npm install
```

### 6. Build the Extension

```bash
npm run build
```

### 7. Load the Extension in Your Browser
* **Chrome/Edge:**
    1.  Open `chrome://extensions`.
    2.  Enable **"Developer mode"**.
    3.  Click **"Load unpacked"**.
    4.  Select the `extension/build` (or `dist`) directory.
* **Firefox:**
    1.  Open `about:debugging`.
    2.  Click **"This Firefox"**.
    3.  Click **"Load Temporary Add-on..."**.
    4.  Select the `manifest.json` file inside the `extension/build` (or `dist`) directory.

---

## 🗺 Roadmap

| Phase | Status      | Key Objectives                                                               |
| :---- | :---------- | :--------------------------------------------------------------------------- |
| **1** | ✅ Complete | **MVP Launch:** Core E2EE messaging, user registration, key management, and a functional browser extension for Gmail. |
| **2** | 🚧 In Progress | **UX & Security Hardening:** Refine UI/UX, strengthen ZKP implementation, add Outlook support, and conduct initial security audits. |
| **3** | 📝 Planned  | **Feature Expansion:** Implement encrypted attachments, begin metadata protection, and develop a standalone desktop client prototype. |

---

## 🚀 Future Plans & Known Limitations

We are committed to continuous improvement. Our current focus is on addressing the prototype's limitations and evolving Kryptmail into a fully-featured, production-ready secure communication platform.

### Areas for Improvement:
* **True E2EE:** Our next major goal is to encrypt email metadata (sender, recipient, subject) to provide a higher level of privacy.
* **Strengthened Cryptography:** We plan to evaluate and potentially increase the key lengths for RSA and explore more modern cryptographic primitives like Elliptic Curve Cryptography (ECC).
* **Advanced Zero-Knowledge Proofs:** Implement a more robust ZKP protocol to enhance security against various attack vectors during authentication.
* **Decentralized Key Storage:** Explore decentralized solutions like blockchain or distributed hash tables (DHTs) for public key storage to eliminate a single point of failure.
* **Security Audits:** Engage third-party security experts to perform comprehensive code audits and penetration testing.
