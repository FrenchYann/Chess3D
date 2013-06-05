set fbxPath=C:\Users\Administrateur\Dropbox\Public\javascript\webGL\chess\3D\fbx\refining\
set jsonPath=C:\Users\Administrateur\Dropbox\Public\javascript\webGL\chess\3D\json\
set pyPath=C:\Python26\python

for %%f in (*.fbx) do (

        "%pyPath%" "%fbxPath%fbx2JSON.py" "%fbxPath%%%~nf.fbx" "%jsonPath%%%~nf.json" -g
)