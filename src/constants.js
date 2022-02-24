export const operations = ['freq', 'mod', 'amount', 'gain']

export const colors = ['darkred', 'blue', 'purple', 'maroon', '#666600', 'saddlebrown', 'mediumvioletred']

export const modules = {
  oscillators: [
    {
      id: 0,
      freq: {
        value: 0,
        offset: 0,
        init: 440,
        min: 55,
        max: 1760,
        step: 1
      },
      mod: {
        value: 0,
        offset: 0,
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      amount: {
        value: 0,
        offset: 0,
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      gain: {
        value: 0,
        offset: 0,
        init: 0.1,
        min: 0,
        max: 1,
        step: 0.05
      }
    }
  ],
  lfos: []
}

export const bps = [{"time":"0.000000","freq":"1156.416870","amp":"0.024335"},{"time":"0.012494","freq":"1155.433960","amp":"0.062435"},{"time":"0.024989","freq":"1156.148682","amp":"0.107494"},{"time":"0.037483","freq":"1157.040771","amp":"0.127655"},{"time":"0.049977","freq":"1151.054932","amp":"0.101125"},{"time":"0.062472","freq":"1146.699341","amp":"0.083212"},{"time":"0.074966","freq":"1148.062866","amp":"0.090763"},{"time":"0.087460","freq":"1155.371948","amp":"0.131205"},{"time":"0.099955","freq":"1157.859009","amp":"0.161039"},{"time":"0.112449","freq":"1163.273438","amp":"0.160339"},{"time":"0.124943","freq":"1168.904907","amp":"0.167292"},{"time":"0.137438","freq":"1169.628540","amp":"0.168247"},{"time":"0.149932","freq":"1166.425903","amp":"0.153411"},{"time":"0.162426","freq":"1159.340942","amp":"0.149450"},{"time":"0.174921","freq":"1158.357422","amp":"0.144806"},{"time":"0.187415","freq":"1161.980591","amp":"0.135174"},{"time":"0.199909","freq":"1167.854004","amp":"0.150303"},{"time":"0.212404","freq":"1168.741333","amp":"0.156753"},{"time":"0.224898","freq":"1164.699951","amp":"0.138298"},{"time":"0.237392","freq":"1158.650269","amp":"0.132501"},{"time":"0.249887","freq":"1157.511597","amp":"0.128299"},{"time":"0.262381","freq":"1161.993896","amp":"0.113622"},{"time":"0.274875","freq":"1169.289551","amp":"0.116355"},{"time":"0.287370","freq":"1170.321655","amp":"0.107045"},{"time":"0.299864","freq":"1163.267822","amp":"0.080779"},{"time":"0.312358","freq":"1155.687988","amp":"0.089895"},{"time":"0.324853","freq":"1155.005737","amp":"0.095295"},{"time":"0.337347","freq":"1157.963501","amp":"0.081237"},{"time":"0.349841","freq":"1173.468140","amp":"0.075181"},{"time":"0.362336","freq":"1174.530884","amp":"0.060095"},{"time":"0.374830","freq":"1177.450928","amp":"0.050092"},{"time":"0.387324","freq":"1180.376587","amp":"0.056136"},{"time":"0.399819","freq":"1179.468628","amp":"0.058314"},{"time":"0.412313","freq":"1174.884155","amp":"0.051572"},{"time":"0.424807","freq":"1176.804810","amp":"0.042916"},{"time":"0.437302","freq":"1178.407471","amp":"0.048765"},{"time":"0.449796","freq":"1177.407715","amp":"0.061781"},{"time":"0.462290","freq":"1173.754150","amp":"0.066124"},{"time":"0.474785","freq":"1169.864990","amp":"0.060102"},{"time":"0.487279","freq":"1155.323730","amp":"0.069658"},{"time":"0.499773","freq":"1154.831177","amp":"0.079858"},{"time":"0.512268","freq":"1157.562622","amp":"0.075497"},{"time":"0.524762","freq":"1168.416992","amp":"0.076519"},{"time":"0.537<t_CO>","freq":"1170.038940","amp":"0.080438"},{"time":"0.549751","freq":"1167.628052","amp":"0.072558"},{"time":"0.562245","freq":"1158.141113","amp":"0.076726"},{"time":"0.574739","freq":"1156.530884","amp":"0.085809"},{"time":"0.587234","freq":"1158.933228","amp":"0.079800"},{"time":"0.599728","freq":"1167.643921","amp":"0.075487"},{"time":"0.612222","freq":"1170.267090","amp":"0.074972"},{"time":"0.624717","freq":"1167.702271","amp":"0.063611"},{"time":"0.637211","freq":"1157.819946","amp":"0.064254"},{"time":"0.649705","freq":"1155.887573","amp":"0.068781"},{"time":"0.662200","freq":"1157.814575","amp":"0.060204"},{"time":"0.674694","freq":"1169.870728","amp":"0.054519"},{"time":"0.687188","freq":"1172.676270","amp":"0.053790"},{"time":"0.699683","freq":"1170.771362","amp":"0.041984"},{"time":"0.712177","freq":"1153.317627","amp":"0.044034"},{"time":"0.724671","freq":"1152.522461","amp":"0.048886"},{"time":"0.737166","freq":"1152.667969","amp":"0.045632"},{"time":"0.749660","freq":"1150.265015","amp":"0.038329"},{"time":"0.762154","freq":"1148.142944","amp":"0.034292"},{"time":"0.774649","freq":"1147.494263","amp":"0.032604"},{"time":"0.787143","freq":"1148.415894","amp":"0.032191"},{"time":"0.799637","freq":"1149.621460","amp":"0.034988"},{"time":"0.812132","freq":"1151.506836","amp":"0.041392"},{"time":"0.824626","freq":"1151.894775","amp":"0.045613"},{"time":"0.837120","freq":"1151.966187","amp":"0.042921"},{"time":"0.849615","freq":"1150.944824","amp":"0.033743"},{"time":"0.862109","freq":"1146.894531","amp":"0.027153"},{"time":"0.874603","freq":"1146.644165","amp":"0.029679"},{"time":"0.887097","freq":"1153.041870","amp":"0.039505"},{"time":"0.899592","freq":"1154.293091","amp":"0.049022"},{"time":"0.912086","freq":"1154.642090","amp":"0.048262"},{"time":"0.924581","freq":"1160.246216","amp":"0.038158"},{"time":"0.937075","freq":"1169.865601","amp":"0.039167"},{"time":"0.949569","freq":"1169.745239","amp":"0.037875"},{"time":"0.962063","freq":"1158.915161","amp":"0.037628"},{"time":"0.974558","freq":"1155.193115","amp":"0.048701"},{"time":"0.987052","freq":"1155.757324","amp":"0.050235"},{"time":"0.999546","freq":"1161.982666","amp":"0.042984"},{"time":"1.012041","freq":"1169.357178","amp":"0.040665"},{"time":"1.024535","freq":"1169.599609","amp":"0.035074"},{"time":"1.037030","freq":"1159.823120","amp":"0.032431"},{"time":"1.049524","freq":"1155.440308","amp":"0.043672"},{"time":"1.062018","freq":"1156.544434","amp":"0.046704"},{"time":"1.074512","freq":"1163.087036","amp":"0.040925"},{"time":"1.087007","freq":"1170.573242","amp":"0.036803"},{"time":"1.099501","freq":"1170.334473","amp":"0.028397"},{"time":"1.111995","freq":"1152.122559","amp":"0.024233"},{"time":"1.124490","freq":"1154.114868","amp":"0.034373"},{"time":"1.136984","freq":"1154.942017","amp":"0.037383"},{"time":"1.149478","freq":"1153.597534","amp":"0.031708"},{"time":"1.161973","freq":"1148.171509","amp":"0.023994"},{"time":"1.174467","freq":"1146.697266","amp":"0.020161"},{"time":"1.186961","freq":"1148.387817","amp":"0.020642"},{"time":"1.199456","freq":"1149.936401","amp":"0.024528"},{"time":"1.211950","freq":"1151.447144","amp":"0.028224"},{"time":"1.224444","freq":"1152.213989","amp":"0.029257"},{"time":"1.236939","freq":"1151.545288","amp":"0.027025"},{"time":"1.249433","freq":"1150.764893","amp":"0.022741"},{"time":"1.261927","freq":"1146.890381","amp":"0.018564"},{"time":"1.274422","freq":"1145.768799","amp":"0.018094"},{"time":"1.286916","freq":"1150.594360","amp":"0.021183"},{"time":"1.299410","freq":"1155.095825","amp":"0.028914"},{"time":"1.311905","freq":"1154.243408","amp":"0.030978"},{"time":"1.324399","freq":"1155.814819","amp":"0.027467"},{"time":"1.336893","freq":"1170.421509","amp":"0.027624"},{"time":"1.349388","freq":"1171.367676","amp":"0.029907"},{"time":"1.374376","freq":"1155.720947","amp":"0.029252"},{"time":"1.386871","freq":"1155.020386","amp":"0.032675"},{"time":"1.399365","freq":"1157.683228","amp":"0.029795"},{"time":"1.411859","freq":"1169.129761","amp":"0.028188"},{"time":"1.424354","freq":"1172.349731","amp":"0.027541"},{"time":"1.436848","freq":"1175.149658","amp":"0.021186"},{"time":"1.449342","freq":"1153.917603","amp":"0.022466"},{"time":"1.461837","freq":"1153.655151","amp":"0.024948"},{"time":"1.474331","freq":"1153.010742","amp":"0.023549"},{"time":"1.486825","freq":"1148.695190","amp":"0.020258"},{"time":"1.499320","freq":"1146.585571","amp":"0.018717"},{"time":"1.511814","freq":"1147.694946","amp":"0.018732"},{"time":"1.524308","freq":"1150.049561","amp":"0.020570"},{"time":"1.536803","freq":"1151.841919","amp":"0.021328"},{"time":"1.549297","freq":"1153.723022","amp":"0.018484"},{"time":"1.561791","freq":"1174.023071","amp":"0.017733"},{"time":"1.574286","freq":"1173.739746","amp":"0.015154"},{"time":"1.586780","freq":"1176.267334","amp":"0.013390"},{"time":"1.599274","freq":"1182.996826","amp":"0.014887"},{"time":"1.636757","freq":"1151.398804","amp":"0.021288"},{"time":"1.649252","freq":"1151.144409","amp":"0.020144"},{"time":"1.661746","freq":"1149.493896","amp":"0.016829"},{"time":"1.674240","freq":"1148.134521","amp":"0.013657"},{"time":"1.686735","freq":"1149.053833","amp":"0.012538"},{"time":"1.699229","freq":"1151.587158","amp":"0.013714"},{"time":"1.711723","freq":"1151.905396","amp":"0.014631"},{"time":"1.724218","freq":"1152.680054","amp":"0.014111"},{"time":"1.736712","freq":"1152.428345","amp":"0.011607"},{"time":"1.749206","freq":"1170.774292","amp":"0.012731"},{"time":"1.761701","freq":"1171.622070","amp":"0.011286"},{"time":"1.774195","freq":"1185.968872","amp":"0.011362"},{"time":"1.799184","freq":"1153.048462","amp":"0.021928"},{"time":"1.811678","freq":"1151.722290","amp":"0.018431"},{"time":"1.824172","freq":"1147.327026","amp":"0.013996"},{"time":"1.836667","freq":"1146.340942","amp":"0.011867"},{"time":"1.849161","freq":"1149.554321","amp":"0.012236"},{"time":"1.861655","freq":"1152.198364","amp":"0.014468"},{"time":"1.874150","freq":"1152.519775","amp":"0.014874"},{"time":"1.886644","freq":"1149.425293","amp":"0.012726"},{"time":"1.899138","freq":"1146.520996","amp":"0.010651"},{"time":"1.911633","freq":"1146.667847","amp":"0.010365"},{"time":"1.924127","freq":"1148.872192","amp":"0.012397"},{"time":"1.936621","freq":"1151.720093","amp":"0.015168"},{"time":"1.949116","freq":"1155.381592","amp":"0.016095"},{"time":"1.961610","freq":"1158.376465","amp":"0.013363"},{"time":"1.974104","freq":"1158.376465","amp":"0.000000"}]
