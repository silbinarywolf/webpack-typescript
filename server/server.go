package server

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

var (
	indexHtml []byte
)

func Start() {
	b, err := ioutil.ReadFile("dist/index.html")
	if err != nil {
		panic(err)
	}
	indexHtml = b
	fs := http.FileServer(http.Dir("dist"))
	http.Handle("/dist", fs)
	http.ListenAndServe(":8080", nil)
}

func RootPath(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "%s", indexHtml)
}
