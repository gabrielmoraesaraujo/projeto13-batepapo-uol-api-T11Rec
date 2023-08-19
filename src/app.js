import express, { request } from "express"
import cors from "cors"
import joi from "joi"
import dotenv from "dotenv"
import { MongoClient } from "mongodb"


const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

//Configuração do banco
const mongoClient = new MongoClient(process.env.DATABASE_URL)

try{
    await mongoClient.connect()
    console.log("Mongodb conectado!")
}catch(err){
    console.log(err.message)
}

const db = mongoClient.db()
//


//Formato de PARTICIPANTE {name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos
//Formato de MENSSAGEM {from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}


//Validação de participantes
const participantsSchema = Joi.object({
    name: Joi.string().required(),
    lastStatus: Joi.number().required()
})

//Validação de menssagens
const messagesSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text: Joi.string().required,
    type: Joi.string().required(),
    time: Joi.number().required() //Date.now() //VOLTAR A MODIFICAR 
})

//ROTAS DE POST

app.post('/participants', async (req, res) => {

    const {name} = request.body

    const validation = participantsSchema.validate(request.body, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(det => det.message)
        return response.status(422).send(errors)
    }


        db.participants.insertOne({name: "fulano"})

    try{

    }catch{

    }
})

app.post('/messages', async (req, res) => {


    try{

    }catch{
        
    }
})

app.post('/status', async (req, res) => {


    try{

    }catch{
        
    }
})


//ROTAS DE GET

app.get('/participants', async (req, res) => {


    try{

    }catch{

    }
})

app.get('/messages', async (req, res) => {


    try{

    }catch{
        
    }
})

app.post('/status', async (req, res) => {


    try{

    }catch{
        
    }
})


//Rota de DELETE





const PORT = 5000
app.listen(PORT, () => console.log(`Aplcação rodando na porta ${PORT}` ))