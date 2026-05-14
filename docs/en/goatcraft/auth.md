---
title: GoatCraft Auth
description: How to use GoatCraft Auth to log in to the server
---

GoatCraft Auth (short for GCA) is an external authentication tool that allows players to log in to the GoatCraft server without using an official Minecraft account. 
This is particularly useful for players who do not own an official account but still wish to experience GoatCraft.

To use GCA, you first need a Minecraft launcher that supports external authentication. 
Below are some Minecraft launchers that support this feature:

- PojavLauncher
- HMCL
- ...

Additionally, you will need a Solarpass account to authorize GoatCraft Auth for login.

!!! note

      GoatCraft Auth is a deployment instance of the open-source project Drasl. Thanks to the development team for their contributions.
      If you want an external authentication service but dislike the PHP and bloated features of Blessing, you can check out the [Drasl](https://github.com/unmojang/drasl) project.

## Direct Usage of GCA

1. Visit the [GoatCraft Auth](https://authmc.solsynth.dev) website.
2. Click the "Sign in with Solarpass" button.
3. Authorize GoatCraft Auth to access your Solarpass account.
4. Follow the prompts to set a Minecraft username.
    - **Note: If you have previously logged in to GoatCraft using an official account, please link your existing Mojang account here. Otherwise, it may cause player data conflicts and result in loss of gameplay progress.**
      **Refer to the section below, 'Players Who Previously Used Official Login', for more details.**
5. Upon completion, you will receive an MC Token and Username. Make a note of them.
6. Open your Minecraft launcher and navigate to the settings page.
7. Locate the "External Login" or similar option, and enter the MC Token and Username obtained from GCA.
    - The setup process may vary depending on the launcher; please refer to your launcher's documentation.
    - The username field should be filled with the character name set in GCA; the password field should be filled with the obtained MC Token.
    - Set the server address to `authmc.solsynth.dev/authlib-injector`.
8. Save the settings and launch the game. You should now be able to log in to the GoatCraft server using GCA.

## Players Who Previously Used Official Login

Even if you have previously logged in to GoatCraft using an official Minecraft account, you can still use GCA. This brings several benefits, such as features that interact with Solar Network, and you won't be prompted with "Link your Solarpass account to unlock more features!" upon rejoining the server.

When following the steps above and reaching step 4, please do not create a new player character. Instead, link your existing Mojang account:

1. On the GCA website, when you see the "Register from an existing account" option, enter the username of your official Minecraft account as prompted.
2. GCA will then ask you to download a skin file, which you need to set as the skin for your official Minecraft account. This is to verify your ownership of the official account.
3. After setting the skin, return to the GCA website and click the "Register" button.
4. You're all set! You can now proceed to step 5 of the previous section to continue with the client configuration.
