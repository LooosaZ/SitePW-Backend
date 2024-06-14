const bodyParser = require("body-parser");
const express = require("express");
const Utilizadores = require("../data/utilizador");
const EmailService = require("../server/emailService");
const scopes = require("../data/utilizador/scopes");

function AuthRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.post("/register", async (req, res) => {
        try {
            let body = req.body;

            if (!body.username || !body.password || !body.nome || !body.morada || !body.telemovel || !body.dataNascimento || !body.nif || !body.email) {
                return res.status(400).send("Todos os campos devem ser preenchidos.");
            }

            let verificarUser = await Utilizadores.findByUsername(body.username);
            if (verificarUser) {
                return res.status(400).send("Esse username já está em uso, escolha outro!");
            }

            let verificarEmail = await Utilizadores.findByEmail(body.email);
            if (verificarEmail) {
                return res.status(400).send("Esse email já está em uso, escolha outro!");
            }

            body.role = body.role || { nome: "utilizador", scopes: [scopes.utilizador] };

            if (body.role.scopes) {
                for (let scope of body.role.scopes) {
                    if (!Object.values(scopes).includes(scope)) {
                        return res.status(400).send("Scope inválido: " + scope);
                    }
                }
            }

            let novoUtilizador = await Utilizadores.create(body);
            res.status(200).json({ success: true, user: novoUtilizador });
        } catch (error) {
            console.error("Erro:", error);
            res.status(500).send("Ocorreu um erro ao registrar um utilizador.");
        }
    });

    router.route("/me").get(function (req, res, next) {
        let token = req.headers["x-access-token"];

        if (!token) { return res.status(401).send({ auth: false, message: "Sem token para verificação!" }); }

        return Utilizadores.verifyToken(token)
            .then((decoded) => { res.status(202).send({ auth: true, decoded }); })
            .catch((err) => {
                res.status(500).send(err);
                next();
            });
    });

    router.post("/login", function (req, res) {
        const { username, password } = req.body;

        Utilizadores.findUser({ username, password })
            .then(utilizador => {
                if (!utilizador) {
                    throw new Error("Utilizador não encontrado");
                }
                return Utilizadores.createToken(utilizador);
            })
            .then(token => {             
                res.cookie('token', token, { httpOnly: false, secure: false, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
                res.send({ auth: true });
            })
            .catch(err => {
                res.status(401).json({ auth: false, message: err.message });
            }); 
    });

    router.route("/forgot-password").post(async function (req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: "O email é obrigatório para a recuperação da password!" });
            }
            const user = await Utilizadores.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "Utilizador não foi encontrado com o email fornecido" });
            }

            const resetToken = Utilizadores.generateResetToken();
            await Utilizadores.updateResetToken(user.id, resetToken);
            await EmailService.sendPasswordResetEmail(email, resetToken);

            res.status(200).json({ success: "Instruções de recuperação de palavra-passe enviadas para o seu email" });
        } catch (error) {
            console.error("Erro:", error);
            res.status(500).json({ error: "Erro ao processar a solicitação de recuperação de password!" });
        }
    });

    router.route("/reset-password").post(async function (req, res, next) {
        try {
            const { email, token, novaPassword } = req.body;
    
            if (!email || !token || !novaPassword) {
                return res.status(400).json({ error: "Email, token e nova password são campos obrigatórios para redefinir a password!" });
            }
    
            const user = await Utilizadores.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "Não foi possível encontrar um utilizador com esse email!" });
            }
    
            if (user.resetToken !== token) {
                return res.status(400).json({ error: "O token é inválido!" });
            }
    
            await Utilizadores.updatePassword(user.id, novaPassword);
            await Utilizadores.clearResetToken(user.id);
    
            res.status(200).json({ success: "Password redefinida com sucesso." });
        } catch (error) {
            console.error("Erro ao processar a solicitação de redefinição de password:", error);
            res.status(500).json({ error: "Erro ao processar a solicitação de redefinição de password!" });
        }
    });

    return router;
}

module.exports = AuthRouter;
