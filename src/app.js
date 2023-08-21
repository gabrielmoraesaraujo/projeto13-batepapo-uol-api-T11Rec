import express, { request, response } from "express"
import cors from "cors"
import joi from "joi"
import dotenv from "dotenv"
import { MongoClient } from "mongodb"
import dayjs from "dayjs"




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
    
    to: joi.string().required(),
    text: joi.string().required,
    type: joi.string().required().pattern(/message/, /private_message/),
    from: joi.string().required()
})

//ROTAS DE POST
app.post('/participants', async (req, response) => {
    const participant = req.body
    const message = {from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')}

    const validation = participantsSchema.validate(participant, { abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(det => det.message)
        return response.status(422).send(errors)
    }
    
    try{
        const participants = await db.collection('participants').find().toArray()
        const nameExists = participants.some(p => p.name === participant.name)

        if(nameExists === false){
        const { name } = participant

        await db.collection('participants').insertOne({ name, 'lastStatus': Date.now() })
        await db.collection('messages').insertOne(message)

        response.status(201).send(request.body)
            }else{
            response.status(409).send("Já existe um participante com este nome!")
        }
    }catch(err){
        response.status(500).send(err.message)
    }

})


app.post('/messages', async(req, res) => {
    const { to, text, type} = req.body
    const user = req.headers.user
    const message = { to, text, type, from: user }
    console.log(message)

    const validation = messagesSchema.validate(message, { abortEarly: false})

    if(validation.error){
        console.log(validation.error.details)
        return res.status(422).send("Aqui")
        
    }

    try{
    const participants = await db.collection('participants').find().toArray()
    const userExists = participants.some(p => p.name === user)
    const time = dayjs().format('HH:mm:ss')

    if(userExists){
        await db.collection('messages').insertOne({...message, time})
        res.sendStatus(201)
    }else{
        console.log(validation.error.details)
        return res.status(422).send(message.err)
        
    }

    }catch(error){
        res.status(500).send(message.error)
    }
})

app.post('/status', async (req, response) => {
    const user = req.headers.user;


    if(user){
        try{
            const userId = await db.collection('participants').findOne({ name: user })
            if(!userId){
                return response.sendStatus(404)
                
            }
            const time = Date.now()
            await db.collection('participants').updateOne({ _id: userId._id }, { $set: {lastStatus: time}})
            response.sendStatus(200)
        
        }catch(error){
            console.error(error)
            response.sendStatus(500)
        }


    }else{
     response.sendStatus(404)
    }
})


//ROTAS DE GET

app.get('/participants', async (req, response) => {
    try {
      const participants = await db.collection('participants').find().toArray()
      response.send(participants)
    } catch (err) {
      response.status(500).send(err.message)
    }
  })

  app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit)
    const user = req.headers.user
	
    try{
        if(limit){
            const messages = await db.collection('messages').find({ $or: [  {to: "Todos"}, {to: user}, {from: user}, {type: "message"} ] }).sort({_id: -1}).limit(limit).toArray()
            res.send(messages.reverse())
        }else{
            const messages = await db.collection('messages').find({ $or: [  {to: "Todos"}, {to: user}, {from: user} ] }).toArray()
            res.send(messages.reverse())
        }

    }catch(error){
        response.status(500).send(err.message)
    }
})

//Removendo participante

setInterval(async () => { 
    const timeNowMinus10s = Date.now() - 10000
    
    try{
        const removeParticipants = await db.collection('participants').find({ lastStatus: {$lt: timeNowMinus10s} }).toArray()
        const removedParticipants = await db.collection('participants').deleteMany({lastStatus: {$lt: timeNowMinus10s}})
 
        removeParticipants.forEach(saiDaSala)

    async function saiDaSala(item, i){
        const message = {from: item.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss')}
        await db.collection('messages').insertOne(message)
    }

    }catch(error){
        console.error(error)
    }
    
}, 15000)





const PORT = 5000
app.listen(PORT, () => console.log(`Aplicação rodando na porta ${PORT}` ))