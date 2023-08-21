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
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required,
    type: joi.string().required().pattern(/message/, /private_message/)
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
    const { to, text, type } = req.body
    const userFrom = req.headers.User
    const message = { to, text, type, from: userFrom }

    const validation = messagesSchema.validate(message, { abortEarly: true})

    if(validation.error){
        console.log(validation.error.details)
        res.sendStatus(422)
        return
    }

    try{
    const participants = await db.collection('participants').find().toArray()
    const userFromExists = participants.some(p => p.name === userFrom)
    const time = dayjs().format('HH:mm:ss')

    if(userFromExists){
        await db.collection('messages').insertOne({...message, time})
        res.sendStatus(201)
    }else{
        console.log(validation.error.details)
        res.sendStatus(422)
        return
    }

    }catch(error){
        console.error(error)
        res.sendStatus(500)
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
        console.error(error)
        res.sendStatus(500)
    }
})

//Rota de DELETE

setInterval(async () => { 
    const timeNowMinus10s = Date.now() - 10000
    
    try{
        const deleteParticipants = await db.collection('participants').find({ lastStatus: {$lt: timeNowMinus10s} }).toArray()

        const deletedParticipants = await db.collection('participants').deleteMany({lastStatus: {$lt: timeNowMinus10s}})
 
        deleteParticipants.forEach(saiDaSala)

    async function saiDaSala(item, indice){
        const message = {from: item.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss')}
        const sairam = await db.collection('messages').insertOne(message)
        console.log(sairam)
    }

    }catch(error){
        console.error(error)
    }
    
}, 15000)





const PORT = 5000
app.listen(PORT, () => console.log(`Aplcação rodando na porta ${PORT}` ))