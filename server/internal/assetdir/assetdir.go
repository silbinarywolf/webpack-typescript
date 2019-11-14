package assetdir

import (
	"flag"
	"path"
)

const AssetFlag = "asset"

var (
	dir      string
	dbDir    string
	modelDir string
)

func init() {
	flag.StringVar(&dir, AssetFlag, "assets", "the directory where assets are stored, ie. models, records")
}

func DatabaseDir() string {
	if dbDir == "" {
		dbDir = path.Join(dir, ".db")
	}
	return dbDir
}

func ModelDir() string {
	if modelDir == "" {
		modelDir = path.Join(dir, ".model")
	}
	return modelDir
}
