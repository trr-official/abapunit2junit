<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:aunit="http://www.sap.com/adt/aunit"
	xmlns:adtcore="http://www.sap.com/adt/core">
	<xsl:template match="/">
		<testsuites>
			<xsl:attribute name="tests">
	    		<xsl:value-of
				select="count(aunit:runResult/program/testClasses/testClass/testMethods/testMethod)" />
	 		</xsl:attribute>
			<xsl:attribute name="failures">
	    		<xsl:value-of
				select="count(aunit:runResult/program/testClasses/testClass/testMethods/testMethod/alerts/alert)" />
	 		</xsl:attribute>
			<xsl:for-each select="aunit:runResult/program">
				<xsl:variable name="object" select="@adtcore:name" />
				<testsuite>
					<xsl:attribute name="name">
	    				<xsl:value-of select="@adtcore:packageName" />
	 				</xsl:attribute>
					<xsl:attribute name="tests">
	    				<xsl:value-of
						select="count(testClasses/testClass/testMethods/testMethod)" />
	 				</xsl:attribute>
					<xsl:attribute name="failures">
	    				<xsl:value-of
						select="count(testClasses/testClass/testMethods/testMethod/alerts/alert)" />
	 				</xsl:attribute>
					<xsl:attribute name="package">
	 					<xsl:value-of select="@adtcore:uri" />
	 				</xsl:attribute>

					<xsl:for-each
						select="testClasses/testClass/testMethods/testMethod">
						<testcase>
							<xsl:attribute name="name">
			 					<xsl:value-of select="@adtcore:packageName" /> - <xsl:value-of select="$object" /> - <xsl:value-of select="@adtcore:name" />
			 				</xsl:attribute>
			 				<xsl:attribute name="classname">
			 					<xsl:value-of select="@adtcore:uri" />
			 				</xsl:attribute>
			 				<xsl:attribute name="time">
			 					<xsl:value-of select="@executionTime" />
			 				</xsl:attribute>
							<xsl:for-each select="alerts/alert">
								<failure>
									<xsl:attribute name="message">
	    								<xsl:value-of select="title" />
	 								</xsl:attribute>
									<xsl:attribute name="type">
	    								<xsl:value-of select="@severity" />
									</xsl:attribute>
 									<xsl:for-each select="details/detail">
 										<xsl:value-of select="@text" />
 										<xsl:value-of select="'&#xA;'" />
 										<xsl:for-each select="details/detail">
 											<xsl:value-of select="@text" />
 											<xsl:value-of select="'&#xA;'" />
										</xsl:for-each>
									</xsl:for-each>
								</failure>
							</xsl:for-each>
						</testcase>
					</xsl:for-each>

				</testsuite>
			</xsl:for-each>
		</testsuites>
	</xsl:template>

</xsl:stylesheet>