package db

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"sort"

	"github.com/silbinarywolf/webpack-typescript/server/internal/assetdir"
	"github.com/silbinarywolf/webpack-typescript/server/internal/schema"
)

var (
	errNoNil = errors.New("expected sliceOfValues to be not nil")
	//errNoPointer = errors.New("expected sliceOfValues to be not an interface{}, not *interface{}")
)

func GetAll(dataModel *schema.DataModel, sliceOfValues *interface{}) error {
	if sliceOfValues == nil {
		return errNoNil
	}
	//if _, ok := sliceOfValues.(interface{}); ok {
	//	return errNoPointer
	//}

	// Load all records
	dir := path.Join(assetdir.DatabaseDir(), dataModel.Table)
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		fileList := make([]string, 0, 100)
		err := filepath.Walk(dir, func(filename string, f os.FileInfo, err error) error {
			if filepath.Ext(filename) == ".json" {
				fileList = append(fileList, filename)
			}
			return err
		})
		if err != nil {
			return errors.New("Error loading list of records from directory: " + err.Error())
		}
		// Sort alphabetically so records are loaded in time-sorted order
		sort.Slice(fileList[:], func(i, j int) bool {
			return fileList[i] < fileList[j]
		})
		list := reflect.ValueOf(*sliceOfValues).Elem()
		for _, filename := range fileList {
			data, err := ioutil.ReadFile(filename)
			if err != nil {
				return err
			}
			record := dataModel.NewPointer()
			err = json.Unmarshal(data, &record)
			if err != nil {
				return err
			}
			list = reflect.Append(list, reflect.ValueOf(record).Elem())
		}
		*sliceOfValues = list.Interface()
	}
	return nil
}

func GetByID(table string, id string, v interface{}) error {
	filename := filepath.Join(assetdir.DatabaseDir(), table, id+".json")
	bytes, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(bytes, v); err != nil {
		return err
	}
	return nil
}
