import express, { request } from "express"
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
    type: joi.string().required(),
    time: joi.number().required() //Date.now() //VOLTAR A MODIFICAR 
})

//ROTAS DE POST


app.post('/participants', async (req, res) => {
    const participant = req.body;
    const message = {from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')};

    const validation = participantsSchema.validate(participant, { abortEarly: false});

    if(validation.error){
        console.log(validation.error.details);
        res.sendStatus(422);
        return;
    }
    
    try{
        const participants = await db.collection('participants').find().toArray();
        const nameExists = participants.some(p => p.name === participant.name);

        if(nameExists === false){
        const { name } = participant;

        await db.collection('participants').insertOne({ name, 'lastStatus': Date.now() });
        await db.collection('messages').insertOne(message);

        res.sendStatus(201);
        }else{
            res.status(409).send("Já existe um participante com este nome!");
        }
    }catch(error){
        console.error(error);
        res.sendStatus(500);
    }

});


app.post('/messages', async(req, res) => {
    const { to, text, type } = req.body
    const userFrom = req.headers.user
    const message = { to, text, type, from: userFrom }

    const validation = messageSchema.validate(message, { abortEarly: true})

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