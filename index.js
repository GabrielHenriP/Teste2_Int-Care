import fs from 'fs';
import pdf from 'pdf-parse';
import ObjectsToCsv from 'objects-to-csv';
import AdmZip from 'adm-zip';
 
let dataBuffer = fs.readFileSync('Padrao_TISS_Componente_Organizacional__202012.pdf');

pdf(dataBuffer).then( data => {
    // array com todas as linhas extraidas do PDF
    const arrayLinesFromPdf = data.text.split('\n').filter( phrase => {
        return /[A-Za-z0-9]/.test(phrase)
    }).map(phrase => phrase.trim())

    let indexesToSlice = [];
    arrayLinesFromPdf.forEach( (phrase, index) => {
        if(phrase.indexOf("Quadro 30") !== -1 || phrase.indexOf("5 ANS") !== -1)
            indexesToSlice.push(index)// guardando num array os indexes das linha "Quadro30" e "5 ANS"
    })
    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_1 = arrayLinesFromPdf.slice(indexesToSlice[0]+4, indexesToSlice[1]+1)
        .map( phrase => {
            let data = {
                'Código': phrase.split(" ").slice(0,1).join(" "),
                'Descrição da categoria': phrase.split(" ").slice(1,phrase.length).join(" ")
            }
            return data
        })
    
    indexesToSlice = [];
    arrayLinesFromPdf.forEach( (phrase, index) => {
        if(phrase.indexOf("Quadro 31") !== -1 || phrase.indexOf("168 Guia de tratamento odontológico") !== -1)
            indexesToSlice.push(index)// guardando num array os indexes das linha "Quadro 31" e "168 Guia de tratamento odontológico"  
    })
    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_2 = arrayLinesFromPdf.slice(indexesToSlice[0]+3, indexesToSlice[1]+1)
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

    indexesToSlice = [];
    arrayLinesFromPdf.forEach( (phrase, index) => {
        phrase.trim()
        if(phrase.indexOf("3 Exclusão") !== -1)
            indexesToSlice.push(index)// guardando o index da linha "3 Exclusão" 
    })
    // tratanto cada linha e guardando em forma de objeto
    const arrayTable_3 = arrayLinesFromPdf.slice(indexesToSlice[0]-2, indexesToSlice[0]+1)
        .map( phrase => {
            let data = {
                'Código': phrase.split(" ").slice(0,1).join(" "),
                'Descrição da categoria': phrase.split(" ").slice(1,phrase.length).join(" ")
            }
            return data
        })
    
    // array tables recebe 3 arrays de objetos, cada um representando uma tabela do PDF
    const tables = [arrayTable_1, arrayTable_2, arrayTable_3]
    
    // salvando cada array dentro de tables como arquvivos csv
    let  numberTable = 30
    tables.map( table => {
        (async () => {
            const csv = new ObjectsToCsv(table);
            await csv.toDisk(`./Teste_Intuitive_Care_Gabriel/Quadro_${numberTable}.csv`);
          })();
          numberTable++;
    })

    // zipando a pasta que contém os arquivos csv
    const zip = new AdmZip();
    zip.addLocalFolder(__dirname+'/Teste_Intuitive_Care_Gabriel')  
    zip.writeZip(__dirname+'/Teste_Intuitive_Care_Gabriel.zip')

})