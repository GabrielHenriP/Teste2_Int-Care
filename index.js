import fs from 'fs';
import pdf from 'pdf-parse';
import ObjectsToCsv from 'objects-to-csv';
import AdmZip from 'adm-zip';

const zip = new AdmZip();
 
let dataBuffer = fs.readFileSync('Padrao_TISS_Componente_Organizacional__202012.pdf');


pdf(dataBuffer).then( data => {
    // Obtendo array com todas as linhas extraidas do PDF após split,filter e trim
    
    return data.text
        .split('\n')
        .filter( phrase => /[A-Za-z0-9]/.test(phrase) )
        .map(phrase => phrase.trim())
    
}).then( arrayLinesFromPdf => {
    // Obtendo indexs de linhas específicas: inicio e fim de cada tabela
    const indexesToSliceObject = getIndexes(arrayLinesFromPdf)

    const tables = separateTables(arrayLinesFromPdf,indexesToSliceObject)

    const dir = 'Teste_Intuitive_Care_Gabriel';

    fs.mkdir(dir, (err) => {
        console.log("Directory is created.");
        saveCsvFiles(tables,dir);
    })
})

function getIndexes(arrayLinesFromPdf){
    
    let object = {
        indexesTable1: [],
        indexesTable2: [],
        indexesTable3: [],
    };
    arrayLinesFromPdf.forEach( (phrase, index) => {
        
        if(phrase.indexOf("Quadro 30") !== -1 || phrase.indexOf("5 ANS") !== -1){
            object['indexesTable1'].push(index)
        }
        if(phrase.indexOf("Quadro 31") !== -1 || phrase.indexOf("168 Guia de tratamento odontológico") !== -1){
            object['indexesTable2'].push(index)
        }
        if(phrase.indexOf("3 Exclusão") !== -1){
            object['indexesTable3'].push(index)
        }
    })
    return object
}

function separateTables(arrayLinesFromPdf,indexesToSliceObject){
    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_1 = arrayLinesFromPdf
        .slice(indexesToSliceObject.indexesTable1[0]+4, indexesToSliceObject.indexesTable1[1]+1)
        .map( phrase => {
            let data = {
                'Código': phrase.split(" ").slice(0,1).join(" "),
                'Descrição da categoria': phrase.split(" ").slice(1,phrase.length).join(" ")
            }
            return data
        })
    
    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_2 = arrayLinesFromPdf
        .slice(indexesToSliceObject.indexesTable2[0]+3, indexesToSliceObject.indexesTable2[1]+1)
        .filter( phrase => {
            return phrase.length > 2 && phrase !== 'Padrão TISS - Componente Organizacional – dezembro de 2020'
        })
        .map( (phrase,index, arrayOrigin) => {
            
            let data= {}
            if(/^\d/.test(phrase) && !(/\d$/.test(phrase))){
                data = {
                    'Código':phrase.split(" ").slice(0,1).join(" "),
                    'Descrição da categoria': phrase.split(" ").slice(1,phrase.length+2).join(" ")
                }
            }
          
            if(/\d$/.test(phrase)){
              data = {
                'Código': phrase,
                'Descrição da categoria': arrayOrigin[index+1]+" "+arrayOrigin[index+2]
              }
            }
          
            return data
        })
        .filter( object => {
            return Object.keys(object).length !== 0
        })

    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_3 = arrayLinesFromPdf
        .slice(indexesToSliceObject.indexesTable3[0]-2, indexesToSliceObject.indexesTable3[0]+1)
        .map( phrase => {
            let data = {
                'Código': phrase.split(" ").slice(0,1).join(" "),
                'Descrição da categoria': phrase.split(" ").slice(1,phrase.length).join(" ")
            }
            return data
        })

    // array tables recebe 3 arrays de objetos, cada um representando uma tabela do PDF
    return [arrayTable_1, arrayTable_2, arrayTable_3];
     
}

function saveCsvFiles(tables,dir){
    let  numberTable = 30
    let count = 0
    tables.map( table => {
        objToCsv(table, numberTable,dir)
            .then(() => {
                console.log()
                count++
                if(count == 3){
                    zipFolder(dir);
                }
            });
        numberTable++;
    });
            
}

async function objToCsv(table,numberTable,dir){
    // transformando as tables em arquivos csv e salvando na pasta dir
    const csv = new ObjectsToCsv(table);
    await csv.toDisk('./'+dir+`/Quadro_${numberTable}.csv`);
}

function zipFolder(dir){
    // zipando a pasta que contém os arquivos csv
    zip.addLocalFolder(__dirname+`/${dir}`)  
    zip.writeZip(__dirname+`/${dir}.zip`)
}
