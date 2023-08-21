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
const participantsSchema = joi.object({
    name: joi.string().required(),

})

//Validação de menssagens
const messagesSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required,
    type: joi.string().required(),
    time: joi.number().required() //Date.now() //VOLTAR A MODIFICAR 
})

//ROTAS DE POST


app.post('/participants', async (request, response) => {

    console.log(request.body)

    const {name} = request.body
//const message = {from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')};
     

    const validation = participantsSchema.validate(request.body, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(det => det.message)
        return response.status(422).send(errors)
    }

    try{
        const participantsExiste = await db.collection("participants").findOne({ name })
        
        

        if (participantsExiste) return response.status(409).send("Esse usuario já existe!")

        await db.collection("participants").insertOne({name, 'lastStatus': Date.now()})
        await db.collection('messages').insertOne(message);

        response.status(201).send(request.body)

    }catch(error){
        response.status(500).send(error.message)

    } 
})

app.post('/messages', async (req, res) => {

    const {to, text, type } = request.body
     

    const validation = messagesSchemaSchema.validate(request.body, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(det => det.message)
        return response.status(422).send(errors)
    }

    try{
        const participantsExiste = await db.collection("participants").findOne({ name, lastStatus })
        if (participantsExiste) return response.status(409).send("Esse usuario já existe!")

        await db.collection("participants").insertOne(request.body)
        response.status(201).send(request.body)

    }catch(err){
        response.status(500).send(err.message)

    } 
})

app.post('/status', async (req, res) => {


    try{

    }catch{
        
    }
})


//ROTAS DE GET

app.get('/participants', async (request, response) => {
    try {
      const participants = await db.collection('participants').find().toArray()
      response.send(participants)
    } catch (err) {
      response.status(500).send(err.message)
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