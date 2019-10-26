package server

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

var (
	indexHtml []byte
)

var (
	//formModelAsBytes []byte
	formModel = FormModel{
		Fields: []FieldModel{
			{
				Kind:  "TextField",
				Name:  "Title",
				Label: "Page Title",
			},
			{
				Kind:  "TextField",
				Name:  "Content",
				Label: "Content",
			},
			{
				Kind:  "TextField",
				Name:  "Name",
				Label: "First Name",
			},
			{
				Kind:  "TextField",
				Name:  "LastName",
				Label: "Last Name",
			},
		},
		Actions: []FieldModel{
			{
				Kind:  "Button",
				Name:  "Edit",
				Label: "Edit",
			},
		},
	}
)

/*func init() {
	var err error
	formModelAsBytes, err = json.Marshal(&formModel)
	if err != nil {
		panic(err)
	}
}*/

type Field struct {
	key      string
	typeName string
}

type Model struct {
	fields []Field
}

type FieldModel struct {
	Kind  string `json:"kind"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

type FormModel struct {
	Fields  []FieldModel `json:"fields"`
	Actions []FieldModel `json:"actions"`
}

type RecordResponse struct {
	Data   map[string]interface{} `json:"data"`
	Errors map[string]string      `json:"errors"`
}

func Start() {
	b, err := ioutil.ReadFile("dist/index.html")
	if err != nil {
		panic(err)
	}
	indexHtml = b
	fs := http.FileServer(http.Dir("dist"))
	http.Handle("/dist", fs)
	http.HandleFunc("/api/Page/Get/", GetModelHandler)
	http.HandleFunc("/api/Page/Edit/", EditModelHandler)
	fmt.Printf("Starting server on :8080...\n")
	http.ListenAndServe(":8080", nil)
}

func handleCors(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func GetModelHandler(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Please send a "+http.MethodGet+" request", 400)
		return
	}
	res := formModel
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func EditModelHandler(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Please send a "+http.MethodPost+" request", 400)
		return
	}
	m := make(map[string]interface{})
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	res := RecordResponse{}
	res.Data = make(map[string]interface{})
	res.Data["Title"] = "New value"
	res.Errors = make(map[string]string)
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func RootPath(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "%s", indexHtml)
}
