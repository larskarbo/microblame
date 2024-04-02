--@block
SELECT
		statementHash,

arraySort(
    arrayMap(
        (x, y) -> (x, y),
        (arrayReduce(
            'sumMap',
            [(groupArrayArray([prismaSpan]) as arrPrismaSpan)],
            [arrayResize(CAST([], 'Array(UInt64)'), length(arrPrismaSpan), toUInt64(1))]
        ) as sPrismaSpan).1,
        sPrismaSpan.2
    )
) as sorted_rPrismaSpan
		--arrayDistinct(groupArray(prismaSpan)) AS distinctPrismaSpans
	FROM
		traced_queries
	GROUP BY
		statementHash;
