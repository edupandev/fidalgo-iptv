# 🚀 FIDAL GO — Guia Oficial: Servidor 24/7 e Aplicativo APK

Seu sistema está 100% configurado com seu domínio fixo do Ngrok:
🌐 **URL Fixa Oficial:** https://fidalgotv.ngrok.app

---

## 📂 1. Estrutura dos Arquivos na sua Área de Trabalho

Dentro da sua pasta você tem:
- **Iniciar-com-Ngrok.bat** ➔ **EXECUTÁVEL PRINCIPAL**: Inicia o servidor local e sobe o túnel fixo https://fidalgotv.ngrok.app.
- **Iniciar-IPTV.bat** ➔ Inicia apenas o servidor local offline na porta 3080 (http://localhost:3080).
- **
grok.exe** ➔ Executável oficial portátil do Ngrok (já autenticado com sua conta).
- **
grok.yml** ➔ Configuração com seu AuthToken e domínio fixo idalgotv.ngrok.app.
- **public/** ➔ Arquivos do aplicativo (filmes, séries, esportes, canais abertos, players e catálogo).
- **public/manifest.json** ➔ Configuração PWA oficial para Android e Android TV.

---

## ⚡ 2. Como Ligar o FIDAL GO no Computador

1. Dê **dois cliques** em:
   👉 **Iniciar-com-Ngrok.bat**
2. O servidor iniciará e o Ngrok conectará o túnel para o seu link fixo:
   `	ext
   Forwarding   https://fidalgotv.ngrok.app -> http://localhost:3080
   `
3. **Mantenha essa janela aberta** enquanto quiser que o serviço fique ativo para seus aparelhos.

---

## 📱 3. Como Acessar e Instalar nas TVs e Celulares

Com o Iniciar-com-Ngrok.bat aberto no computador:

### No Celular Android (Instalação PWA Instantânea):
1. Abra o Google Chrome no seu celular e digite:
   👉 **https://fidalgotv.ngrok.app**
2. Toque nos **3 pontinhos** no canto superior direito.
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. O ícone oficial do **FIDAL GO** aparecerá como um aplicativo nativo na tela do celular e abrirá em tela cheia!

### Na Android TV / TV Box / Fire TV Stick:
1. Abra o app **TV Bro** (navegador para controle remoto, grátis na Play Store da TV) ou **Downloader**.
2. Digite a URL:
   👉 **https://fidalgotv.ngrok.app**
3. Adicione aos favoritos ou atalhos da tela inicial da sua TV.

---

## 📦 4. Como Gerar o Arquivo Instalador (.APK) Definitivo

Como seu domínio https://fidalgotv.ngrok.app é **fixo e nunca muda**, você só precisa gerar o APK uma única vez:

1. Acesse o gerador oficial da Microsoft:
   👉 **https://www.pwabuilder.com**
2. Cole a sua URL:
   `	ext
   https://fidalgotv.ngrok.app
   `
3. Clique em **"Start"** para analisar o site.
4. Clique no botão **"Package for Android"**.
5. Baixe o arquivo **.apk**.
6. Transfira para a sua Android TV / TV Box (via pendrive ou pelo app *Send Files to TV*) e instale!

Esse APK funcionará para sempre, bastando que o seu computador esteja ligado com o Iniciar-com-Ngrok.bat rodando!

---

🎉 **Pronto! Seu FIDAL GO está completo e pronto para rodar em qualquer lugar!**
