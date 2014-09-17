[{
	"name" : "base1",
	"require" : [],
	"deps" : {
		"component-a" : "1.0.0",
		"widget-a" : "1.0.0"
	}
}, {
	"name" : "app1",
	"require" : ["base1"],
	"deps" : {
		"page-a" : "1.0.0",
		"module2" : "1.0.0"
	}
}]