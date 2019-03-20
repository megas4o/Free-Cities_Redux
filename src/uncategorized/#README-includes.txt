all .tw passages that are included from other passages via the <<include>> macro should be stored in this folder or its subfolders for organizational purposes

for these included passages, it is not safe to assume that a temporary variable (starting with underscore _ character) will be confined in scope to that file alone

when passages are included by other passages, any variables that they set will override variables in the calling passage, so extra care should be taken in these passages if they use $i, _i, _j or other common variable names to ensure that callers are not expecting those variables to be unchanged after the include


all sa... passages

arcologyDescription
arcologyOpinion
neighborDescription
officeDescription

surgeryDegradation

weekly

	persBusiness
	rulesAssistantReport

penthouse

	fullReport
	penthouseReport

neighbors

	neighborsDevelopment
	neighborsFSAdoption

facilities

	arcadeReport
	brothelReport
	cellblockReport
	clinicReport
	clubReport
	dairyReport
	labReport
	masterSuiteReport
	schoolroomReport
	servantsQuartersReport
	spaReport

economics

	corporationDevelopments
	marketsReport

npc
	degradingName
	fAbuse
	fFeelings
	fKiss
	fPCImpreg
	fRelation
	fRival
	fSlaveImpreg
	fSlaveImpregConsummate
	generateNewSlave
	generateXXSlave
	generateXYSlave
	hgApplication
	lawCompliance
	longSlaveDescription
	newSlaveIntro
	removeActiveSlave
	slaveSummary

init

	initRules
	backwardsCompatibility
